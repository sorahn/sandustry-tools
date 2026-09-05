import { expect, test } from "bun:test";
import { extractSavedBlueprints } from "../src/index";

test("extracts valid saved blueprints and preserves blueprint data", () => {
  const extracted = extractSavedBlueprints({
    store: {
      mods: {
        blueprints: {
          saved: [
            {
              id: "bp-1",
              name: "Signal tile",
              timestamp: 123,
              data: [
                { type: 3, x: 0, y: 4, filter: { mode: "allow" }, data: { custom: true } },
                { type: "signalGate", x: 8, y: 4 },
              ],
              signalLinks: [{ from: { x: 100, y: 200 }, to: { x: 108, y: 200 }, on: true }],
            },
          ],
        },
      },
    },
  });

  expect(extracted.diagnostics).toEqual([]);
  expect(extracted.summaries).toEqual([
    { id: "bp-1", name: "Signal tile", structureCount: 2, createdAt: 123 },
  ]);
  expect(extracted.blueprints[0]).toEqual({
    id: "bp-1",
    name: "Signal tile",
    timestamp: 123,
    data: [
      { type: 3, x: 0, y: 4, filter: { mode: "allow" }, data: { custom: true } },
      { type: "signalGate", x: 8, y: 4 },
    ],
    signalLinks: [{ from: { x: 100, y: 200 }, to: { x: 108, y: 200 }, on: true }],
  });
});

test("rejects malformed records independently and supplies a fallback name", () => {
  const extracted = extractSavedBlueprints({
    store: {
      mods: {
        blueprints: {
          saved: [
            { id: "good", data: [] },
            { id: "", name: "bad", data: [] },
            { id: "bad-data", name: "bad", data: [{ type: 1, x: -1, y: 0 }] },
          ],
        },
      },
    },
  });

  expect(extracted.blueprints).toEqual([
    { id: "good", name: "Blueprint good", data: [], signalLinks: null },
  ]);
  expect(extracted.diagnostics).toHaveLength(2);
  expect(extracted.diagnostics.map(({ code }) => code)).toEqual([
    "invalid-blueprint",
    "invalid-blueprint",
  ]);
});

test("extracts the checked-in save blueprint summary", async () => {
  const save = Bun.file(new URL("./visual/saves/main-save.save", import.meta.url));
  const { decodeBrowserSave } = await import("../src/index");
  const extracted = extractSavedBlueprints((await decodeBrowserSave(await save.bytes())).payload);

  expect(extracted.diagnostics).toEqual([]);
  expect(extracted.summaries).toEqual([
    {
      id: "17867734613400jmyzeln3",
      name: "Sand Washer, Shaker, And Burner - Tileable",
      structureCount: 871,
      createdAt: 1786773461340,
    },
  ]);
});
