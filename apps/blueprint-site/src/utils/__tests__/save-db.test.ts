import { afterEach, describe, expect, test } from "bun:test";
import { estimateStoredBytes, getSavedGameBytes, listSavedGames, storeSave } from "../save-db";

const originalIndexedDb = (globalThis as typeof globalThis & { indexedDB?: unknown }).indexedDB;

afterEach(() => {
  if (originalIndexedDb === undefined) delete (globalThis as { indexedDB?: unknown }).indexedDB;
  else
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
});

describe("save IndexedDB storage", () => {
  test("returns an explicit unavailable result when IndexedDB is missing", async () => {
    delete (globalThis as { indexedDB?: unknown }).indexedDB;

    const listed = await listSavedGames();
    const bytes = await getSavedGameBytes("missing");
    const estimated = await estimateStoredBytes();
    const stored = await storeSave(new Uint8Array([1, 2]), {
      id: "save-1",
      fileName: "save.save",
      storedAt: new Date(0).toISOString(),
      structureCount: 0,
      blueprintCount: 0,
      byteLength: 2,
      blueprints: [],
    });

    expect(listed).toMatchObject({ ok: false, error: { code: "unavailable" } });
    expect(bytes).toMatchObject({ ok: false, error: { code: "unavailable" } });
    expect(estimated).toMatchObject({ ok: false, error: { code: "unavailable" } });
    expect(stored).toMatchObject({ ok: false, error: { code: "unavailable" } });
  });
});
