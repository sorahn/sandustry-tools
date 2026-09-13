import assert from "node:assert/strict";
import test from "node:test";
import { encodeCellIdsToRle, readRendererTerrainRle } from "./terrain.ts";

test("encodeCellIdsToRle encodes empty and terrain runs correctly", () => {
  const cellIds = new Int32Array([0, 0, 0, 1, 1, 2, 2, 2, 2, 0]);
  const { matrix, transientCount } = encodeCellIdsToRle(cellIds, cellIds.length);

  assert.deepEqual(matrix, [0, 3, 1, 2, 2, 4, 0, 1]);
  assert.equal(transientCount, 0);

  let total = 0;
  for (let i = 1; i < matrix.length; i += 2) {
    total += matrix[i];
  }
  assert.equal(total, cellIds.length);
});

test("encodeCellIdsToRle normalizes transient simulation elements (>1000) and negatives to 0", () => {
  const cellIds = [15, 15, 1000005, 1000005, -5, 15];
  const { matrix, transientCount } = encodeCellIdsToRle(cellIds, cellIds.length);

  assert.deepEqual(matrix, [15, 2, 0, 3, 15, 1]);
  assert.equal(transientCount, 2);
});

test("encodeCellIdsToRle handles uniform grid", () => {
  const cellIds = new Uint16Array(100).fill(7);
  const { matrix, transientCount } = encodeCellIdsToRle(cellIds, 100);

  assert.deepEqual(matrix, [7, 100]);
  assert.equal(transientCount, 0);
});

test("encodeCellIdsToRle rejects when array length is smaller than expectedLength", () => {
  const cellIds = new Int32Array([1, 2, 3]);
  assert.throws(
    () => encodeCellIdsToRle(cellIds, 10),
    /cellIds length \(3\) is smaller than expectedLength \(10\)/,
  );
});

test("readRendererTerrainRle reads from global sandkit state and encodes RLE", () => {
  const globalScope = globalThis as typeof globalThis & { sandkit?: unknown };
  const previousSandkit = globalScope.sandkit;

  const mockCellIds = new Int32Array([1, 1, 1, 0, 0, 2, 2, 1005]);
  globalScope.sandkit = {
    engine: {
      state: {
        store: {
          world: { size: { width: 4, height: 2 } },
          meta: { seed: "seed-456" },
          version: "0.5.6",
        },
        shared: {
          sim: {
            width: 4,
            height: 2,
            cellIds: mockCellIds,
          },
        },
      },
    },
  };

  try {
    const payload = readRendererTerrainRle();
    assert.equal(payload.seed, "seed-456");
    assert.equal(payload.version, "0.5.6");
    assert.equal(payload.width, 4);
    assert.equal(payload.height, 2);
    assert.deepEqual(payload.matrix, [1, 3, 0, 2, 2, 2, 0, 1]);
    assert.equal(payload.transientCellsHandled, 1);
  } finally {
    globalScope.sandkit = previousSandkit;
  }
});
