#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { SandustryProcgenSession } from "./procgen/session.ts";
import { createSyntheticSaveDocument } from "./procgen/save-adapter.ts";
import { renderTerrainMinimapPng } from "./procgen/render.ts";

export type SeedManifestEntry = {
  requestedSeed: string;
  actualSeed?: string;
  filename: string;
  status: "generated" | "skipped" | "failed";
  sha256?: string;
  width?: number;
  height?: number;
  worldSize?: { width: number; height: number };
  transientCellsHandled?: number;
  durationMs?: number;
  error?: string;
  timestamp: string;
};

export type SeedManifest = {
  version: string;
  generatedAt: string;
  seeds: SeedManifestEntry[];
};

export function parseSeedsFile(content: string): string[] {
  const seen = new Set<string>();
  const seeds: string[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    if (!seen.has(line)) {
      seen.add(line);
      seeds.push(line);
    }
  }

  return seeds;
}

export function sanitizeSeedFilename(seed: string): string {
  const sanitized = seed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "empty";
  return `${sanitized}.png`;
}

function parseArgs(args: string[]) {
  let seedsPath: string | null = null;
  let outDir = "artifacts/seed-minimaps";
  let force = false;
  let visible = false;
  let timeoutMs = 120_000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--view" || arg === "-v") {
      visible = true;
    } else if (arg.startsWith("--out=")) {
      outDir = arg.slice(6);
    } else if (arg === "-o" || arg === "--out") {
      outDir = args[++i];
    } else if (arg.startsWith("--timeout=")) {
      timeoutMs = Number.parseInt(arg.slice(10), 10);
    } else if (arg.startsWith("--seeds=")) {
      seedsPath = arg.slice(8);
    } else if (!arg.startsWith("-") && !seedsPath) {
      seedsPath = arg;
    }
  }

  return { seedsPath, outDir, force, visible, timeoutMs };
}

export async function runBatchGenerate(options: {
  seeds: string[];
  outDir: string;
  force?: boolean;
  visible?: boolean;
  timeoutMs?: number;
}): Promise<SeedManifest> {
  const { seeds, outDir, force = false, visible = false, timeoutMs = 120_000 } = options;
  mkdirSync(outDir, { recursive: true });

  const manifestPath = join(outDir, "manifest.json");
  const existingEntries = new Map<string, SeedManifestEntry>();
  if (existsSync(manifestPath)) {
    try {
      const prev = JSON.parse(readFileSync(manifestPath, "utf8")) as SeedManifest;
      if (Array.isArray(prev?.seeds)) {
        for (const entry of prev.seeds) {
          existingEntries.set(entry.requestedSeed, entry);
        }
      }
    } catch {
      /* ignore invalid manifest */
    }
  }

  const entries: SeedManifestEntry[] = [];
  let session: SandustryProcgenSession | null = null;

  try {
    for (let index = 0; index < seeds.length; index++) {
      const seed = seeds[index];
      const filename = sanitizeSeedFilename(seed);
      const filePath = join(outDir, filename);
      const now = new Date().toISOString();

      if (!force && existsSync(filePath)) {
        console.log(`[${index + 1}/${seeds.length}] Skipping existing: ${seed} (${filename})`);
        const existing = existingEntries.get(seed);
        if (existing && existing.sha256) {
          entries.push({ ...existing, status: "skipped", timestamp: now });
        } else {
          const fileBytes = readFileSync(filePath);
          const sha256 = createHash("sha256").update(fileBytes).digest("hex");
          entries.push({
            requestedSeed: seed,
            filename,
            status: "skipped",
            sha256,
            timestamp: now,
          });
        }
        continue;
      }

      let isInitial = false;
      if (!session) {
        console.log("Starting headless Sandustry session...");
        session = await SandustryProcgenSession.start({ visible, initialSeed: seed, timeoutMs });
        isInitial = true;
      }

      console.log(`[${index + 1}/${seeds.length}] Generating seed: "${seed}" -> ${filename}`);
      const startTime = performance.now();

      try {
        if (!isInitial) {
          await session.navigateToSeed(seed, { timeoutMs });
        }
        const captured = await session.captureTerrain();
        const doc = createSyntheticSaveDocument(captured);
        const { png, width, height } = renderTerrainMinimapPng(doc);

        writeFileSync(filePath, png);
        const sha256 = createHash("sha256").update(png).digest("hex");
        const durationMs = Math.round(performance.now() - startTime);

        console.log(
          `  ✓ Saved ${filename} (${width}x${height}, ${(png.length / 1024).toFixed(1)} KB, ${durationMs} ms)`,
        );

        entries.push({
          requestedSeed: seed,
          actualSeed: captured.seed,
          filename,
          status: "generated",
          sha256,
          width,
          height,
          worldSize: { width: captured.width, height: captured.height },
          transientCellsHandled: captured.transientCellsHandled,
          durationMs,
          timestamp: now,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ Failed seed "${seed}": ${message}`);
        entries.push({
          requestedSeed: seed,
          filename,
          status: "failed",
          error: message,
          timestamp: now,
        });
      }
    }
  } finally {
    if (session) {
      console.log("Closing Sandustry session...");
      await session.close();
    }
  }

  const manifest: SeedManifest = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    seeds: entries,
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function main() {
  const { seedsPath, outDir, force, visible, timeoutMs } = parseArgs(process.argv.slice(2));

  if (!seedsPath) {
    console.error("Usage: bun run scripts/generate-seed-minimaps.ts <seeds.txt> [options]");
    console.error("Options:");
    console.error("  --out=<dir>, -o <dir>  Output directory (default: artifacts/seed-minimaps)");
    console.error("  --force, -f            Force regeneration of existing files");
    console.error("  --view, -v             Visible Chrome window for debugging");
    console.error("  --timeout=<ms>         Timeout per seed in milliseconds (default: 120000)");
    process.exit(1);
  }

  const resolvedSeedsPath = resolve(seedsPath);
  if (!existsSync(resolvedSeedsPath)) {
    console.error(`Seeds file not found: ${resolvedSeedsPath}`);
    process.exit(1);
  }

  const rawSeeds = readFileSync(resolvedSeedsPath, "utf8");
  const seeds = parseSeedsFile(rawSeeds);
  console.log(`Loaded ${seeds.length} unique seed(s) from ${basename(seedsPath)}`);

  if (seeds.length === 0) {
    console.log("No valid seeds to process.");
    process.exit(0);
  }

  const resolvedOutDir = resolve(outDir);
  const manifest = await runBatchGenerate({
    seeds,
    outDir: resolvedOutDir,
    force,
    visible,
    timeoutMs,
  });

  const generated = manifest.seeds.filter((s) => s.status === "generated").length;
  const skipped = manifest.seeds.filter((s) => s.status === "skipped").length;
  const failed = manifest.seeds.filter((s) => s.status === "failed").length;

  console.log(`\nComplete: ${generated} generated, ${skipped} skipped, ${failed} failed.`);
  console.log(`Manifest: ${join(resolvedOutDir, "manifest.json")}`);
}

if (import.meta.main || process.argv[1]?.endsWith("generate-seed-minimaps.ts")) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
