#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { SandustryProcgenSession } from "./procgen/session.ts";
import { createSyntheticSaveDocument } from "./procgen/save-adapter.ts";
import { renderTerrainMinimapPng } from "./procgen/render.ts";
import {
  scanHellevatorShafts,
  type HellevatorShaft,
  type HellevatorScanResult,
} from "../packages/sandustry-save-core/src/index.ts";

export type SeedMetadata = {
  requestedSeed: string;
  actualSeed?: string;
  imageFilename: string;
  metaFilename: string;
  status: "generated" | "skipped" | "failed";
  sha256?: string;
  width?: number;
  height?: number;
  worldSize?: { width: number; height: number };
  transientCellsHandled?: number;
  durationMs?: number;
  error?: string;
  timestamp: string;
  hellevators?: HellevatorShaft[];
};

export type BatchGenerateResult = {
  results: SeedMetadata[];
  generated: number;
  skipped: number;
  failed: number;
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

export function formatFileUrl(filePath: string): string {
  const resolved = resolve(filePath);
  return `file://${resolved}`;
}

export function sanitizeSeedBasename(seed: string): string {
  return seed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "empty";
}

export function sanitizeSeedFilename(seed: string): string {
  return `${sanitizeSeedBasename(seed)}.png`;
}

export function sanitizeSeedMetaFilename(seed: string): string {
  return `${sanitizeSeedBasename(seed)}.json`;
}

export function formatHellevatorTable(result: HellevatorScanResult): string {
  if (result.shafts.length === 0) {
    return "  No hellevator shafts found matching criteria.\n";
  }

  const lines: string[] = [
    `  Hellevator Scan (minWidth=${result.options.minWidth} cells [${result.options.minWidth / 4} tile], ranking=${result.options.ranking}):`,
    "  " +
      "Rank".padEnd(6) +
      "Tile X (Cells)".padEnd(22) +
      "Width".padEnd(16) +
      "Tile Y Span (Cells)".padEnd(28) +
      "Underground".padEnd(18) +
      "Total Depth".padEnd(16) +
      "Surface".padEnd(12) +
      "Bedrock",
    "  " + "-".repeat(116),
  ];

  for (const s of result.shafts) {
    const rankStr = `#${s.rank}`.padEnd(6);
    const xStr = `${s.tileX.toFixed(1)} (${s.startX}..${s.endX})`.padEnd(22);
    const wStr = `${s.tileWidth}t (${s.width}c)`.padEnd(16);
    const yStr =
      `[${s.tileStartY.toFixed(0)}..${s.tileEndY.toFixed(0)}] (${s.startY}..${s.endY})`.padEnd(28);
    const undergrStr = `${s.tileUndergroundDepth.toFixed(1)}t (${s.undergroundDepth}c)`.padEnd(18);
    const totalStr = `${s.tileLength.toFixed(1)}t (${s.length}c)`.padEnd(16);
    const surfStr = (s.reachesSurface ? "✓ Sky" : "✗ Cavern").padEnd(12);
    const bedStr = s.reachesBedrock ? "✓ Bedrock" : "No";

    let line = `  ${rankStr}${xStr}${wStr}${yStr}${undergrStr}${totalStr}${surfStr}${bedStr}`;
    if (s.composition && Object.keys(s.composition).length > 0) {
      const topMats = Object.entries(s.composition)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([m, p]) => `${m} ${p}%`)
        .join(", ");
      line += `  [${topMats}]`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}

function parseArgs(args: string[]) {
  let seedsPath: string | null = null;
  const directSeeds: string[] = [];
  let outDir = "artifacts/seed-minimaps";
  let explicitForce: boolean | null = null;
  let visible = false;
  let timeoutMs = 120_000;
  let explicitScan: boolean | null = null;
  let explicitHighlight: boolean | null = null;
  let minWidth = 4;
  let topK = 5;
  let surfaceOnly = false;
  let excludeEdgeMargin = 0;
  let ranking: "underground" | "total" = "underground";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--force" || arg === "-f") {
      explicitForce = true;
    } else if (arg === "--no-force" || arg === "--skip-existing") {
      explicitForce = false;
    } else if (arg === "--view" || arg === "-v") {
      visible = true;
    } else if (arg.startsWith("--out=")) {
      outDir = arg.slice(6);
    } else if (arg === "-o" || arg === "--out") {
      outDir = args[++i];
    } else if (arg.startsWith("--timeout=")) {
      timeoutMs = Number.parseInt(arg.slice(10), 10);
    } else if (arg.startsWith("--seeds=") || arg.startsWith("--file=")) {
      seedsPath = arg.slice(arg.indexOf("=") + 1);
    } else if (arg === "-s" || arg === "--seed") {
      if (args[i + 1] && !args[i + 1].startsWith("-")) {
        directSeeds.push(args[++i]);
      }
    } else if (arg.startsWith("--seed=")) {
      directSeeds.push(arg.slice(7));
    } else if (arg === "--scan" || arg === "--hellevator") {
      explicitScan = true;
    } else if (arg === "--no-scan" || arg === "--no-hellevator") {
      explicitScan = false;
    } else if (arg === "--highlight" || arg === "--highlight-hellevator") {
      explicitHighlight = true;
      explicitScan = true;
    } else if (arg === "--no-highlight") {
      explicitHighlight = false;
    } else if (arg.startsWith("--min-width=")) {
      minWidth = Number.parseInt(arg.slice(12), 10);
    } else if (arg.startsWith("--top=")) {
      topK = Number.parseInt(arg.slice(6), 10);
    } else if (arg === "--surface-only") {
      surfaceOnly = true;
    } else if (arg.startsWith("--edge-margin=") || arg.startsWith("--exclude-edge=")) {
      excludeEdgeMargin = Number.parseInt(arg.slice(arg.indexOf("=") + 1), 10);
    } else if (arg.startsWith("--ranking=")) {
      const val = arg.slice(10);
      if (val === "underground" || val === "total") ranking = val;
    } else if (!arg.startsWith("-")) {
      if (existsSync(resolve(arg))) {
        seedsPath = arg;
      } else {
        directSeeds.push(arg);
      }
    }
  }

  // Default to force regeneration for direct one-off seed runs unless explicitly disabled
  const force = explicitForce !== null ? explicitForce : directSeeds.length > 0;
  const scanHellevator = explicitScan !== null ? explicitScan : directSeeds.length > 0;
  // If scanning is active, default highlight to true unless explicitly disabled with --no-highlight
  const highlightHellevator = explicitHighlight !== null ? explicitHighlight : scanHellevator;

  return {
    seedsPath,
    directSeeds,
    outDir,
    force,
    visible,
    timeoutMs,
    scanHellevator,
    highlightHellevator,
    minWidth,
    topK,
    surfaceOnly,
    excludeEdgeMargin,
    ranking,
  };
}

export async function runBatchGenerate(options: {
  seeds: string[];
  outDir: string;
  force?: boolean;
  visible?: boolean;
  timeoutMs?: number;
  scanHellevator?: boolean;
  highlightHellevator?: boolean;
  minWidth?: number;
  topK?: number;
  surfaceOnly?: boolean;
  excludeEdgeMargin?: number;
  ranking?: "underground" | "total";
}): Promise<BatchGenerateResult> {
  const {
    seeds,
    outDir,
    force = false,
    visible = false,
    timeoutMs = 120_000,
    scanHellevator = false,
    highlightHellevator = false,
    minWidth = 4,
    topK = 5,
    surfaceOnly = false,
    excludeEdgeMargin = 0,
    ranking = "underground",
  } = options;
  mkdirSync(outDir, { recursive: true });

  const results: SeedMetadata[] = [];
  let session: SandustryProcgenSession | null = null;

  try {
    for (let index = 0; index < seeds.length; index++) {
      const seed = seeds[index];
      const imageFilename = sanitizeSeedFilename(seed);
      const metaFilename = sanitizeSeedMetaFilename(seed);
      const imagePath = join(outDir, imageFilename);
      const metaPath = join(outDir, metaFilename);
      const now = new Date().toISOString();

      if (!force && existsSync(imagePath)) {
        console.log(`[${index + 1}/${seeds.length}] Skipping existing: ${seed} (${imageFilename})`);
        console.log(`  → Image: ${formatFileUrl(imagePath)}`);
        if (existsSync(metaPath)) {
          console.log(`  → Meta:  ${formatFileUrl(metaPath)}`);
          try {
            const prev = JSON.parse(readFileSync(metaPath, "utf8")) as SeedMetadata;
            results.push({ ...prev, status: "skipped" });
          } catch {
            results.push({
              requestedSeed: seed,
              imageFilename,
              metaFilename,
              status: "skipped",
              timestamp: now,
            });
          }
        } else {
          results.push({
            requestedSeed: seed,
            imageFilename,
            metaFilename,
            status: "skipped",
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

      console.log(`[${index + 1}/${seeds.length}] Generating seed: "${seed}" -> ${imageFilename}`);
      const startTime = performance.now();

      try {
        if (!isInitial) {
          await session.navigateToSeed(seed, { timeoutMs });
        }
        const captured = await session.captureTerrain();
        const doc = createSyntheticSaveDocument(captured);

        let hellevators: HellevatorShaft[] | undefined;
        if (scanHellevator) {
          const scanResult = scanHellevatorShafts(doc, {
            minWidth,
            topK,
            surfaceOnly,
            excludeEdgeMargin,
            ranking,
          });
          hellevators = scanResult.shafts;
          console.log(formatHellevatorTable(scanResult));
        }

        const { png, width, height } = renderTerrainMinimapPng(doc, {
          highlightShafts: highlightHellevator && hellevators ? hellevators : undefined,
        });

        writeFileSync(imagePath, png);
        const sha256 = createHash("sha256").update(png).digest("hex");
        const durationMs = Math.round(performance.now() - startTime);

        const metadata: SeedMetadata = {
          requestedSeed: seed,
          actualSeed: captured.seed,
          imageFilename,
          metaFilename,
          status: "generated",
          sha256,
          width,
          height,
          worldSize: { width: captured.width, height: captured.height },
          transientCellsHandled: captured.transientCellsHandled,
          durationMs,
          timestamp: now,
          hellevators,
        };

        writeFileSync(metaPath, `${JSON.stringify(metadata, null, 2)}\n`);

        console.log(
          `  ✓ Saved ${imageFilename} (${width}x${height}, ${(png.length / 1024).toFixed(1)} KB, ${durationMs} ms)`,
        );
        console.log(`  → Image: ${formatFileUrl(imagePath)}`);
        console.log(`  → Meta:  ${formatFileUrl(metaPath)}\n`);

        results.push(metadata);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ Failed seed "${seed}": ${message}`);
        const failMeta: SeedMetadata = {
          requestedSeed: seed,
          imageFilename,
          metaFilename,
          status: "failed",
          error: message,
          timestamp: now,
        };
        try {
          writeFileSync(metaPath, `${JSON.stringify(failMeta, null, 2)}\n`);
        } catch {}
        results.push(failMeta);
      }
    }
  } finally {
    if (session) {
      console.log("Closing Sandustry session...");
      await session.close();
    }
  }

  const generated = results.filter((s) => s.status === "generated").length;
  const skipped = results.filter((s) => s.status === "skipped").length;
  const failed = results.filter((s) => s.status === "failed").length;

  return { results, generated, skipped, failed };
}

async function main() {
  const {
    seedsPath,
    directSeeds,
    outDir,
    force,
    visible,
    timeoutMs,
    scanHellevator,
    highlightHellevator,
    minWidth,
    topK,
    surfaceOnly,
    excludeEdgeMargin,
    ranking,
  } = parseArgs(process.argv.slice(2));

  const seeds: string[] = [];

  if (seedsPath) {
    const resolvedSeedsPath = resolve(seedsPath);
    if (!existsSync(resolvedSeedsPath)) {
      console.error(`Seeds file not found: ${resolvedSeedsPath}`);
      process.exit(1);
    }
    const rawSeeds = readFileSync(resolvedSeedsPath, "utf8");
    const loaded = parseSeedsFile(rawSeeds);
    console.log(`Loaded ${loaded.length} unique seed(s) from ${basename(seedsPath)}`);
    for (const s of loaded) {
      if (!seeds.includes(s)) seeds.push(s);
    }
  }

  for (const s of directSeeds) {
    const trimmed = s.trim();
    if (trimmed && !seeds.includes(trimmed)) {
      seeds.push(trimmed);
    }
  }

  if (seeds.length === 0) {
    console.error("Usage: bun run scripts/generate-seed-minimaps.ts <seed|seeds.txt> [options]");
    console.error("Options:");
    console.error("  --seed=<seed>, -s <seed>  Single seed to generate (or pass as argument)");
    console.error("  --seeds=<file>, --file    Seeds file path to read seeds from");
    console.error(
      "  --out=<dir>, -o <dir>     Output directory (default: artifacts/seed-minimaps)",
    );
    console.error("  --force, -f               Force regeneration of existing files");
    console.error("  --view, -v                Visible Chrome window for debugging");
    console.error("  --timeout=<ms>            Timeout per seed in milliseconds (default: 120000)");
    console.error(
      "  --scan, --hellevator      Scan for vertical hellevator shafts (default for direct seeds)",
    );
    console.error("  --no-scan                 Disable hellevator scan");
    console.error(
      "  --highlight               Overlay hellevator shafts visually on the rendered PNG",
    );
    console.error(
      "  --min-width=<cells>       Minimum shaft width in cells (default: 4 cells = 1 tile)",
    );
    console.error("  --top=<n>                 Number of top shafts to report (default: 5)");
    console.error("  --surface-only            Only report shafts starting at the surface/sky");
    process.exit(1);
  }

  const resolvedOutDir = resolve(outDir);
  const result = await runBatchGenerate({
    seeds,
    outDir: resolvedOutDir,
    force,
    visible,
    timeoutMs,
    scanHellevator,
    highlightHellevator,
    minWidth,
    topK,
    surfaceOnly,
    excludeEdgeMargin,
    ranking,
  });

  console.log(
    `\nComplete: ${result.generated} generated, ${result.skipped} skipped, ${result.failed} failed.`,
  );
  console.log(`Output directory: ${formatFileUrl(resolvedOutDir)}`);
}

if (import.meta.main || process.argv[1]?.endsWith("generate-seed-minimaps.ts")) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
