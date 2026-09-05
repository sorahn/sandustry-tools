import { decodeBlueprint } from "@daryl.roberts/sandustry-blueprint-core";
import type { BlueprintVisualFixture } from "./catalog";

const KNOWN_LABELS: Record<string, string> = {
  burnerbelt: "Burner belts",
  "edge-fade": "Edge fade",
  fans: "Fans",
  "filter-hell": "Filter hell",
  foundation: "Foundation",
  "kitchen-sink": "Kitchen sink",
  launchers: "Launchers",
  logic: "Logic",
  prefab: "Prefab",
  pyros: "Pyros",
  "sand-sprayer-48": "Sand sprayer 48",
  smoke: "Smoke",
  "unknown-modded-blocks": "Unknown modded blocks",
  velocity: "Velocity",
  z: "Z ordering",
};

function formatLabel(name: string): string {
  if (KNOWN_LABELS[name]) return KNOWN_LABELS[name];
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractBaseName(pathOrFilename: string): string {
  const match = pathOrFilename.match(/([^/\\]+)\.txt$/);
  return match ? match[1] : pathOrFilename;
}

function loadRawBaselines(): Record<string, string> {
  // Bun test runner:
  if (typeof Bun !== "undefined") {
    const req = (import.meta as Record<string, any>)["require"];
    const fs = req("node:fs");
    const path = req("node:path");
    const dir = path.resolve(
      import.meta.dirname,
      "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints",
    );
    const result: Record<string, string> = {};
    for (const file of fs.readdirSync(dir).sort()) {
      if (file.endsWith(".txt")) {
        result[file] = fs.readFileSync(path.join(dir, file), "utf8").trim();
      }
    }
    return result;
  }

  // Vite browser dev & build runtime:
  // Vite dynamically matches and watches all *.txt files in core's visual test blueprints directory
  // @ts-ignore
  return import.meta.glob<string>(
    "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/*.txt",
    { query: "?raw", import: "default", eager: true },
  );
}

export function getCoreVisualBaselines(): BlueprintVisualFixture[] {
  const raw = loadRawBaselines();
  const entries: BlueprintVisualFixture[] = [];
  for (const [key, source] of Object.entries(raw)) {
    const name = extractBaseName(key);
    const label = formatLabel(name);
    entries.push({
      id: `baseline-${name}`,
      label: `Baseline: ${label}`,
      blueprint: decodeBlueprint((source as string).trim()),
    });
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

export const CORE_VISUAL_BASELINES: BlueprintVisualFixture[] = getCoreVisualBaselines();
