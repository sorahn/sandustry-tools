import assert from "node:assert/strict";
import { test } from "bun:test";
import {
  deserializeSelection,
  isNoFilter,
  NO_FILTER_SELECTION,
  serializeSelection,
} from "../src/terrainCatalog";

const available = [
  { id: "stone", type: 3, name: "Stone", color: "#777777" },
  { id: "dirt", type: 4, name: "Dirt", color: "#884422" },
  { id: "caldera", type: 200, name: "Caldera", color: "#ff7700" },
  { id: "freezingIceSoil", type: 201, name: "Freezing Ice Soil", color: "#aaddff" },
];

test("multiple selected terrains survive storage round trips, including new terrain IDs", () => {
  const selected = deserializeSelection("terrain:stone,caldera", available);
  assert.deepEqual(selected.types, [3, 200]);
  assert.equal(isNoFilter(selected), false);
  assert.deepEqual(deserializeSelection(serializeSelection(selected), available), selected);
});

test("selection matching handles case and duplicates without changing canonical IDs", () => {
  const selected = deserializeSelection("terrain:STONE, stone,Caldera,caldera", available);
  assert.deepEqual(selected.ids, ["stone", "caldera"]);
  assert.equal(serializeSelection(selected), "terrain:stone,caldera");
});

test("legacy terrain aliases and Earth presets retain available selections", () => {
  assert.deepEqual(deserializeSelection("terrain:frostbed", available).ids, ["freezingIceSoil"]);
  assert.deepEqual(deserializeSelection("filter:earth", available).ids, ["dirt"]);
});

test("removed terrain IDs do not discard other valid saved selections", () => {
  assert.deepEqual(deserializeSelection("terrain:removed,stone", available).ids, ["stone"]);
});

test("no-filter and unavailable saved selections use the native unfiltered mode", () => {
  for (const saved of [undefined, null, "", "terrain:no-filter", "terrain:removed"]) {
    assert.equal(deserializeSelection(saved, available), NO_FILTER_SELECTION);
  }
  assert.equal(isNoFilter(NO_FILTER_SELECTION), true);
  assert.equal(serializeSelection(NO_FILTER_SELECTION), "terrain:no-filter");
});
