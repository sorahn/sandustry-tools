import { afterEach, describe, expect, test } from "bun:test";
import "fake-indexeddb/auto";
import {
  deleteSavedGame,
  estimateStoredBytes,
  getSavedGameBytes,
  listSavedGames,
  readActiveSaveId,
  SAVE_DATABASE_NAME,
  setActiveSaveId,
  storeSave,
  subscribeToSaveDatabase,
  type SaveDatabaseEvent,
} from "../save-db";

const originalIndexedDb = (globalThis as typeof globalThis & { indexedDB?: unknown }).indexedDB;
const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window;

function installStorage(values: Record<string, string> = {}) {
  const stored = new Map(Object.entries(values));
  const localStorage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });
  return stored;
}

afterEach(() => {
  if (originalIndexedDb === undefined) delete (globalThis as { indexedDB?: unknown }).indexedDB;
  else
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
  if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
  else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
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

  test("notifies subscribers when saves are stored, deleted, or active save changes", async () => {
    installStorage();
    await deleteDatabase();
    const events: SaveDatabaseEvent[] = [];
    const unsubscribe = subscribeToSaveDatabase((event) => {
      events.push(event);
    });

    const bytes = new Uint8Array([1, 2]);
    const saveSummary = summary("save-notify", 2);
    await storeSave(bytes, saveSummary);

    expect(readActiveSaveId()).toBe("save-notify");
    expect(events).toEqual([
      { type: "active-save-changed", saveId: "save-notify" },
      { type: "save-stored", summary: saveSummary },
    ]);

    setActiveSaveId("save-other");
    expect(readActiveSaveId()).toBe("save-other");
    expect(events[events.length - 1]).toEqual({
      type: "active-save-changed",
      saveId: "save-other",
    });

    setActiveSaveId("save-notify");
    await deleteSavedGame("save-notify");
    expect(readActiveSaveId()).toBeNull();
    expect(events.slice(-2)).toEqual([
      { type: "active-save-changed", saveId: null },
      { type: "save-deleted", saveId: "save-notify" },
    ]);

    unsubscribe();
    setActiveSaveId("save-after-unsubscribe");
    expect(events[events.length - 1]).toEqual({
      type: "save-deleted",
      saveId: "save-notify",
    });
  });
});
