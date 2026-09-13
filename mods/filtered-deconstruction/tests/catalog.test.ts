import { describe, expect, it } from "bun:test";
import {
  NO_FILTER_ENTRY,
  NO_FILTER_ID,
  NO_FILTER_SELECTION,
  deserializeSelection,
  getCategoryColor,
  isNoFilter,
  serializeSelection,
} from "../src/structureCatalog";
import type { StructureEntry, StructureSelection } from "../src/ui/picker/pickerTypes";

describe("structureCatalog", () => {
  const sampleEntries: StructureEntry[] = [
    { id: "conveyor", type: 1, name: "Conveyor", categoryKey: "logistics", color: "#38bdf8" },
    { id: "pipe", type: 2, name: "Pipe", categoryKey: "logistics", color: "#38bdf8" },
    { id: "assembler", type: 10, name: "Assembler", categoryKey: "production", color: "#f59e0b" },
    { id: "furnace", type: 11, name: "Furnace", categoryKey: "production", color: "#f59e0b" },
    {
      id: "prefab",
      type: "prefab",
      types: ["prefabTerrain_1", "prefabTerrain_2"],
      name: "Prefab",
      categoryKey: "blocks",
      color: "#60a5fa",
    },
  ];

  it("identifies no-filter selection correctly", () => {
    expect(isNoFilter(NO_FILTER_SELECTION)).toBe(true);
    expect(isNoFilter(null)).toBe(true);
    expect(isNoFilter(undefined)).toBe(true);
    expect(isNoFilter({ ids: [], types: [], entries: [] })).toBe(true);
    expect(isNoFilter({ ids: [NO_FILTER_ID], types: [], entries: [NO_FILTER_ENTRY] })).toBe(true);

    const activeSelection: StructureSelection = {
      ids: ["conveyor"],
      types: [1],
      entries: [sampleEntries[0]],
    };
    expect(isNoFilter(activeSelection)).toBe(false);
  });

  it("serializes and deserializes selections reliably", () => {
    expect(serializeSelection(NO_FILTER_SELECTION)).toBe("structures:no-filter");

    const multiSelection: StructureSelection = {
      ids: ["conveyor", "pipe"],
      types: [1, 2],
      entries: [sampleEntries[0], sampleEntries[1]],
    };
    const serialized = serializeSelection(multiSelection);
    expect(serialized).toBe("structures:conveyor,pipe");

    const restored = deserializeSelection(serialized, sampleEntries);
    expect(restored.ids).toEqual(["conveyor", "pipe"]);
    expect(restored.types).toEqual([1, 2]);
    expect(restored.entries).toHaveLength(2);
  });

  it("falls back to NO_FILTER_SELECTION on invalid or empty saved string", () => {
    expect(deserializeSelection(null, sampleEntries)).toEqual(NO_FILTER_SELECTION);
    expect(deserializeSelection("", sampleEntries)).toEqual(NO_FILTER_SELECTION);
    expect(deserializeSelection("structures:no-filter", sampleEntries)).toEqual(
      NO_FILTER_SELECTION,
    );
    expect(deserializeSelection("structures:nonexistent", sampleEntries)).toEqual(
      NO_FILTER_SELECTION,
    );
  });

  it("resolves category colors with fallbacks", () => {
    expect(getCategoryColor("logistics")).toBe("#38bdf8");
    expect(getCategoryColor("production")).toBe("#f59e0b");
    expect(getCategoryColor("energy")).toBe("#eab308");
    expect(getCategoryColor("unknownCategory")).toBe("#94a3b8");
    expect(getCategoryColor(undefined)).toBe("#94a3b8");
  });
});
