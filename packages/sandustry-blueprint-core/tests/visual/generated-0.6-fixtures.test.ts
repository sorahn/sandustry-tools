import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "bun:test";
import { CATALOG, decodeBlueprint, encodeBlueprint } from "../../src/index";
import additions from "../../../../scripts/catalog/sandustry-0.6.json";
import landingPad from "../fixtures/native-0.6-landing-pad.json";

function read(name: string) {
  return decodeBlueprint(
    readFileSync(new URL(`./blueprints/${name}.txt`, import.meta.url), "utf8").trim(),
  );
}

test("gas baselines preserve liquid fixture geometry and metadata", () => {
  for (const name of ["pipeworks", "pipe-layer[pipes]"]) {
    const liquid = read(name);
    const gas = read(`gas-${name}`);
    assert.deepEqual(gas.signalLinks, liquid.signalLinks);
    assert.deepEqual(
      gas.data.map((record) => ({
        ...record,
        type: { gasPipe: 23, gasPump: 24, gasVent: 25 }[String(record.type)] ?? record.type,
      })),
      liquid.data,
    );
  }
});

test("two 0.6 kitchen sinks cover every catalog ID and native directional form", () => {
  const parts = [read("kitchen-sink-0.6"), read("kitchen-sink-0.6-part-2")];
  const types = new Set(parts.flatMap((part) => part.data.map((record) => record.type)));
  for (const entry of CATALOG) {
    assert.ok(types.has(entry.type), `Missing catalog type: ${entry.type}`);
  }
  for (const entry of additions.entries) {
    assert.ok(parts[0].data.some((record) => record.type === entry.type));
    for (const variant of entry.variants ?? []) {
      assert.ok(
        parts[0].data.some((record) => record.type === variant.id),
        `Missing directional variant: ${variant.id}`,
      );
    }
  }
  for (const part of parts) {
    assert.ok(new Set(part.data.map((record) => record.type)).size <= 64);
    assert.deepEqual(decodeBlueprint(encodeBlueprint(part)), part);
  }
});

test("kitchen sink building samples have at least one tile of clearance", () => {
  const samples = [
    read("kitchen-sink-0.6").data.slice(0, 57),
    read("kitchen-sink-0.6-part-2").data,
  ];
  for (const records of samples) {
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const a = records[i];
        const b = records[j];
        const af = CATALOG.find((entry) => entry.type === a.type)!.footprint;
        const bf = CATALOG.find((entry) => entry.type === b.type)!.footprint;
        assert.ok(
          a.x + af.width + 4 <= b.x ||
            b.x + bf.width + 4 <= a.x ||
            a.y + af.height + 4 <= b.y ||
            b.y + bf.height + 4 <= a.y,
          `Insufficient clearance: ${a.type} and ${b.type}`,
        );
      }
    }
  }
});

test("landing pad preserves the native 42-part construction layout", () => {
  const records = read("kitchen-sink-0.6").data.slice(57, 57 + landingPad.data.length);
  assert.equal(records.length, 42);
  const originY = Math.min(...records.map((record) => record.y)) - 8;
  assert.deepEqual(
    records.map((record) => ({ ...record, y: record.y - originY })),
    landingPad.data,
  );
  assert.ok(read("kitchen-sink-0.6").data.some((record) => record.type === "gasPipe"));
});
