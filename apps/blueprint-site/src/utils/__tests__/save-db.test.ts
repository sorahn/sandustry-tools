import { afterEach, describe, expect, test } from "bun:test";
import "fake-indexeddb/auto";
import {
  deleteSavedGame,
  estimateStoredBytes,
  getSavedGameBytes,
  listSavedGames,
  SAVE_DATABASE_NAME,
  storeSave,
} from "../save-db";

const originalIndexedDb = (globalThis as typeof globalThis & { indexedDB?: unknown }).indexedDB;

afterEach(() => {
  if (originalIndexedDb === undefined) delete (globalThis as { indexedDB?: unknown }).indexedDB;
  else
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
});

const summary = (id: string, byteLength: number) => ({
  id,
  fileName: `${id}.save`,
  storedAt: new Date(0).toISOString(),
  structureCount: 2,
  blueprintCount: 0,
  byteLength,
  blueprints: [],
});

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(SAVE_DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("database deletion blocked"));
  });
}

describe("save IndexedDB storage", () => {
  test("stores, replaces, lists, reads, estimates, and deletes", async () => {
    await deleteDatabase();
    const first = new Uint8Array([1, 2, 3]);
    expect(await storeSave(first, summary("save-1", 3))).toMatchObject({ ok: true });
    expect(await listSavedGames()).toMatchObject({ ok: true, value: [summary("save-1", 3)] });
    expect(await getSavedGameBytes("save-1")).toMatchObject({ ok: true, value: first });

    const replacement = new Uint8Array([9, 8]);
    expect(await storeSave(replacement, summary("save-1", 2))).toMatchObject({ ok: true });
    expect(await getSavedGameBytes("save-1")).toMatchObject({ ok: true, value: replacement });
    expect(await estimateStoredBytes()).toMatchObject({ ok: true, value: 2 });
    expect(await deleteSavedGame("save-1")).toMatchObject({ ok: true });
    expect(await listSavedGames()).toMatchObject({ ok: true, value: [] });
  });

  test("returns an explicit unavailable result when IndexedDB is missing", async () => {
    await deleteDatabase();
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
