import { readFileSync } from "node:fs";

const OPERATIONS = new Set(["replace", "remove", "insertBefore", "insertAfter", "wrap"]);
const PATCH_FILE = /^js\/(?:[^/]+\/)*[^/]+\.js$/;
const IDENTIFIER = /^[A-Za-z0-9._-]+$/;

export function validatePatches(patches, label = "patches.json") {
  if (!Array.isArray(patches)) throw new Error(`${label} must contain an array`);
  if (patches.length > 256) throw new Error(`${label} may contain at most 256 patches`);

  const ids = new Set();
  for (const [index, patch] of patches.entries()) {
    const prefix = `${label}[${index}]`;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error(`${prefix} must be an object`);
    }

    const value = /** @type {Record<string, unknown>} */ (patch);
    if (
      typeof value.id !== "string" ||
      !value.id ||
      value.id.length > 128 ||
      !IDENTIFIER.test(value.id)
    ) {
      throw new Error(
        `${prefix}.id must be 1-128 letters, numbers, periods, underscores, or hyphens`,
      );
    }
    if (ids.has(value.id)) throw new Error(`duplicate patch id "${value.id}"`);
    ids.add(value.id);

    if (
      typeof value.file !== "string" ||
      !PATCH_FILE.test(value.file) ||
      value.file.includes("..")
    ) {
      throw new Error(`${prefix}.file must be a relative JavaScript path under js/`);
    }
    if (typeof value.operation !== "string" || !OPERATIONS.has(value.operation)) {
      throw new Error(`${prefix}.operation is unsupported`);
    }
    if (!Number.isInteger(value.expectedMatches) || value.expectedMatches <= 0) {
      throw new Error(`${prefix}.expectedMatches must be a positive integer`);
    }

    const hasFind = typeof value.find === "string" && value.find.length > 0;
    const hasRegex = value.regex && typeof value.regex === "object" && !Array.isArray(value.regex);
    if (hasFind === Boolean(hasRegex))
      throw new Error(`${prefix} must set exactly one of find or regex`);
    if (hasRegex) {
      const regex = /** @type {Record<string, unknown>} */ (value.regex);
      if (typeof regex.pattern !== "string" || typeof regex.flags !== "string") {
        throw new Error(`${prefix}.regex requires pattern and flags strings`);
      }
      if (/[^imsu]/.test(regex.flags) || new Set(regex.flags).size !== regex.flags.length) {
        throw new Error(`${prefix}.regex.flags may contain only unique i, m, s, and u flags`);
      }
      try {
        new RegExp(regex.pattern, regex.flags);
      } catch (error) {
        throw new Error(`${prefix}.regex is invalid: ${error.message}`);
      }
    }

    if (
      value.occurrence !== undefined &&
      value.occurrence !== "all" &&
      (!Number.isInteger(value.occurrence) || value.occurrence <= 0)
    ) {
      throw new Error(`${prefix}.occurrence must be "all" or a positive integer`);
    }
    if (
      value.atomicGroup !== undefined &&
      (typeof value.atomicGroup !== "string" ||
        !value.atomicGroup ||
        value.atomicGroup.length > 128 ||
        !IDENTIFIER.test(value.atomicGroup))
    ) {
      throw new Error(`${prefix}.atomicGroup is invalid`);
    }

    if (value.operation === "wrap") {
      if (typeof value.before !== "string" || typeof value.after !== "string") {
        throw new Error(`${prefix}.wrap requires before and after strings`);
      }
    } else if (value.operation !== "remove" && (typeof value.code !== "string" || !value.code)) {
      throw new Error(`${prefix}.${value.operation} requires a non-empty code string`);
    }
  }

  return patches;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node scripts/validate-patches.mjs <patches.json>");
    process.exit(2);
  }
  try {
    validatePatches(JSON.parse(readFileSync(path, "utf8")), path);
    console.log(`validated ${path}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
