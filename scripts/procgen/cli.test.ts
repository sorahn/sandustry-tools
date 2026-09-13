import assert from "node:assert/strict";
import test from "node:test";
import { parseSeedsFile, sanitizeSeedFilename } from "../generate-seed-minimaps.ts";

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

test("sanitizeSeedFilename creates clean deterministic filenames", () => {
  assert.equal(sanitizeSeedFilename("my-seed-123"), "my-seed-123.png");
  assert.equal(sanitizeSeedFilename("Seed with Spaces!"), "Seed_with_Spaces_.png");
  assert.equal(sanitizeSeedFilename("seed/with/slashes"), "seed_with_slashes.png");
  assert.equal(sanitizeSeedFilename(""), "empty.png");
});
