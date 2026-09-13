import assert from "node:assert/strict";
import test from "node:test";
import { createSyntheticSaveDocument } from "./save-adapter.ts";
import { renderTerrainMinimapPng } from "./render.ts";

test("renderTerrainMinimapPng produces a valid PNG from synthetic save", () => {
  // 16x16 world with 4x4 minimap cells -> 4x4 raster
  const captured = {
    seed: "png-test-1",
    version: "0.5.6",
    width: 16,
    height: 16,
    matrix: [0, 128, 1, 128], // 256 cells
    transientCellsHandled: 0,
  };

  const doc = createSyntheticSaveDocument(captured);
  const { png, width, height } = renderTerrainMinimapPng(doc);

  assert.equal(width, 4);
  assert.equal(height, 4);
  assert.ok(png.length > 0);
  // PNG signature: 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
  assert.equal(png[2], 0x4e);
  assert.equal(png[3], 0x47);
});
