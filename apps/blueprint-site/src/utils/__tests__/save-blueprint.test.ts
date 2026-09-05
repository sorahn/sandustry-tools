import { expect, test } from "bun:test";
import { decodeBlueprint, prepareBlueprint } from "@daryl.roberts/sandustry-blueprint-core";
import { encodeSavedBlueprint } from "../save-blueprint";
import type { SaveBlueprintRecord } from "@sandustry/save-core";

test("round-trips validated save records through the canonical encoder", () => {
  const record: SaveBlueprintRecord = {
    id: "bp-1",
    name: "Compatibility",
    timestamp: 10,
    data: [
      { type: 3, x: 0, y: 0, filter: { mode: "allow", elementType: [1, 2] } },
      { type: "signalGate", x: 8, y: 0, data: { desiredOpen: true } },
    ],
    signalLinks: [{ from: { x: 0, y: 0 }, to: { x: 8, y: 0 }, on: true }],
  };

  expect(decodeBlueprint(encodeSavedBlueprint(record))).toEqual({
    name: record.name,
    data: record.data,
    signalLinks: record.signalLinks,
  });
});

test("preserves offset signal links for the blueprint core offset inference", () => {
  const record: SaveBlueprintRecord = {
    id: "bp-offset",
    name: "Offset signals",
    data: [
      { type: "signalBuffer", x: 0, y: 8 },
      { type: "signalToggle", x: 8, y: 8 },
    ],
    signalLinks: [{ from: { x: 2096, y: 1020 }, to: { x: 2104, y: 1020 }, on: false }],
  };
  const decoded = decodeBlueprint(encodeSavedBlueprint(record));
  const prepared = prepareBlueprint(decoded);

  expect(prepared.signalCoordinateOffset).toEqual({ x: 2096, y: 1012 });
  expect(prepared.preparedSignalLinks[0].path.kind).toBe("line");
});

test("keeps the canonical encoder's 64-type limit visible", () => {
  const record: SaveBlueprintRecord = {
    id: "bp-large",
    name: "Too many types",
    data: Array.from({ length: 65 }, (_, index) => ({ type: `mod-${index}`, x: index, y: 0 })),
    signalLinks: null,
  };

  expect(() => encodeSavedBlueprint(record)).toThrow(
    "v2 blueprint encoding cannot represent more than 64 structure types",
  );
});
