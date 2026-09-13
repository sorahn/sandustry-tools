import assert from "node:assert/strict";
import test from "node:test";
import {
  expandRunLengthPairs,
  normalizeSaveDocument,
  prepareSaveExplorerRenderState,
} from "../../packages/sandustry-save-core/src/index.ts";
import { createSyntheticSaveDocument } from "./save-adapter.ts";
import type { CapturedTerrainPayload } from "./terrain.ts";

test("createSyntheticSaveDocument produces a valid SaveGameDocument", () => {
  const captured: CapturedTerrainPayload = {
    seed: "alpha-42",
    version: "0.5.6",
    width: 4,
    height: 4,
    matrix: [0, 8, 1, 8], // 16 cells
    transientCellsHandled: 0,
  };

  const doc = createSyntheticSaveDocument(captured);
  assert.equal(doc.metadata.seed, "alpha-42");
  assert.equal(doc.metadata.id, "procgen-alpha-42");
  assert.deepEqual(doc.payload.store.world, { size: { width: 4, height: 4 } });

  // Expand RLE and verify exact dimensions
  const expanded = expandRunLengthPairs<number>(doc.payload.matrix, 16);
  assert.equal(expanded.length, 16);
  assert.deepEqual(expanded, [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]);

  // Verify normalizeSaveDocument produces no errors
  const normalized = normalizeSaveDocument(doc);
  assert.equal(normalized.world.width, 4);
  assert.equal(normalized.world.height, 4);
  assert.equal(normalized.diagnostics.filter((d) => d.severity === "error").length, 0);

  // Verify save-core minimap state preparation succeeds
  const prepared = prepareSaveExplorerRenderState(doc, { cellSize: 1 });
  assert.equal(prepared.width, 4);
  assert.equal(prepared.height, 4);
  assert.equal(prepared.terrainValues.length, 16);
});

test("createSyntheticSaveDocument rejects invalid RLE dimensions", () => {
  const invalid: CapturedTerrainPayload = {
    seed: "bad-seed",
    version: "0.5.6",
    width: 4,
    height: 4,
    matrix: [0, 10], // only 10 cells instead of 16
    transientCellsHandled: 0,
  };

  assert.throws(
    () => createSyntheticSaveDocument(invalid),
    /Matrix cell count \(10\) does not match expected world dimensions \(4x4 = 16\)/,
  );
});

test("createSyntheticSaveDocument rejects odd-length matrix", () => {
  const odd: CapturedTerrainPayload = {
    seed: "bad-odd",
    version: "0.5.6",
    width: 2,
    height: 2,
    matrix: [0, 4, 1],
    transientCellsHandled: 0,
  };

  assert.throws(() => createSyntheticSaveDocument(odd), /length 3 is not even/);
});
