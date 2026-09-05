#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = path.join(root, "packages", "sandustry-mod-template");

function git(args, cwd = template) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function runGit(args, cwd = template) {
  execFileSync("git", args, { cwd, stdio: "inherit" });
}

const status = git(["status", "--porcelain"]);
if (status.trim()) {
  throw new Error(
    "The SandustryModTemplate checkout has local changes. Commit or stash them before updating.",
  );
}

const remotes = git(["remote"])
  .split("\n")
  .map((remote) => remote.trim())
  .filter(Boolean);
if (!remotes.includes("upstream")) {
  throw new Error(
    "The SandustryModTemplate checkout has no upstream remote. Add the official template repository as upstream first.",
  );
}

runGit(["checkout", "main"]);
runGit(["fetch", "upstream", "main"]);
runGit(["merge", "--ff-only", "upstream/main"]);
runGit(["add", "--", "packages/sandustry-mod-template"], root);

console.log("Updated packages/sandustry-mod-template from upstream/main.");
console.log("The parent submodule pointer is staged; review and commit it when ready.");
