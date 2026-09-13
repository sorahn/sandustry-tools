import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSeedsFile,
  sanitizeSeedFilename,
  sanitizeSeedMetaFilename,
} from "../generate-seed-minimaps.ts";

test("parseSeedsFile ignores comments and blank lines, trims and deduplicates", () => {
  const content = `
# This is a comment
alpha
  beta
# Another comment
alpha
gamma

  # Indented comment
delta
`;

  const seeds = parseSeedsFile(content);
  assert.deepEqual(seeds, ["alpha", "beta", "gamma", "delta"]);
});

test("sanitizeSeedFilename and sanitizeSeedMetaFilename create clean deterministic filenames", () => {
  assert.equal(sanitizeSeedFilename("my-seed-123"), "my-seed-123.png");
  assert.equal(sanitizeSeedMetaFilename("my-seed-123"), "my-seed-123.json");
  assert.equal(sanitizeSeedFilename("Seed with Spaces!"), "Seed_with_Spaces_.png");
  assert.equal(sanitizeSeedMetaFilename("Seed with Spaces!"), "Seed_with_Spaces_.json");
  assert.equal(sanitizeSeedFilename("seed/with/slashes"), "seed_with_slashes.png");
  assert.equal(sanitizeSeedFilename(""), "empty.png");
  assert.equal(sanitizeSeedMetaFilename(""), "empty.json");
});

test("formatHellevatorTable formats scan results cleanly", () => {
  const { formatHellevatorTable } = require("../generate-seed-minimaps.ts");
  const table = formatHellevatorTable({
    worldWidth: 16,
    worldHeight: 16,
    options: {
      minWidth: 4,
      minLength: 4,
      topK: 1,
      surfaceOnly: false,
      clusterDistance: 4,
      ranking: "underground",
      excludeEdgeMargin: 0,
    },
    shafts: [
      {
        rank: 1,
        startX: 4,
        endX: 7,
        width: 4,
        startY: 0,
        endY: 15,
        length: 16,
        surfaceY: 4,
        undergroundDepth: 12,
        reachesSurface: true,
        reachesBedrock: true,
        tileX: 1,
        tileEndX: 1.75,
        tileWidth: 1,
        tileStartY: 0,
        tileEndY: 3.75,
        tileLength: 4,
        tileUndergroundDepth: 3,
        composition: { Dirt: 80, Stone: 20 },
      },
    ],
  });

  assert.ok(table.includes("Hellevator Scan"));
  assert.ok(table.includes("#1"));
  assert.ok(table.includes("Dirt 80%"));
});
