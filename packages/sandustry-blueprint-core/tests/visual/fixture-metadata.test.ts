import assert from "node:assert/strict";
import { test } from "bun:test";
import { parseVisualFixtureFilename } from "./fixture-metadata.mjs";

test("parses ordinary and global-layer visual fixture filenames", () => {
  assert.deepEqual(parseVisualFixtureFilename("logic.txt"), {
    filename: "logic.txt",
    name: "logic",
    id: "logic",
    outputName: "logic",
    layers: [],
    renderOptions: {},
  });
  assert.deepEqual(parseVisualFixtureFilename("pipe-layer[pipes].txt"), {
    filename: "pipe-layer[pipes].txt",
    name: "pipe-layer",
    id: "pipe-layer[pipes]",
    outputName: "pipe-layer-pipes",
    layers: ["pipes"],
    renderOptions: { showPipeModeOverlay: true },
  });
});

test("rejects unknown global-layer tags", () => {
  assert.throws(
    () => parseVisualFixtureFilename("future[layer-that-does-not-exist].txt"),
    /Unknown visual fixture layer/,
  );
});
