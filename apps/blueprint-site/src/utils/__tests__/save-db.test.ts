import { afterEach, describe, expect, test } from "bun:test";
import "fake-indexeddb/auto";
import {
  deleteSavedGame,
  estimateStoredBytes,
  extractCurrencies,
  formatPlaytime,
  formatProductionPoints,
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

  test("lists saves ordered by upload date (newest on top)", async () => {
    await deleteDatabase();
    const older = {
      ...summary("save-older", 10),
      storedAt: "2026-01-01T10:00:00.000Z",
    };
    const newer = {
      ...summary("save-newer", 20),
      storedAt: "2026-01-02T10:00:00.000Z",
    };
    const newest = {
      ...summary("save-newest", 30),
      storedAt: "2026-01-03T10:00:00.000Z",
    };

    // Store in mixed order
    await storeSave(new Uint8Array([1]), older);
    await storeSave(new Uint8Array([3]), newest);
    await storeSave(new Uint8Array([2]), newer);

    const listed = await listSavedGames();
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.value.map((s) => s.id)).toEqual(["save-newest", "save-newer", "save-older"]);
    }
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

  test("formatPlaytime formats milliseconds correctly", () => {
    expect(formatPlaytime(undefined)).toBeUndefined();
    expect(formatPlaytime(0)).toBeUndefined();
    expect(formatPlaytime(-5)).toBeUndefined();
    expect(formatPlaytime(5416)).toBe("< 1m");
    expect(formatPlaytime(120_000)).toBe("2m");
    expect(formatPlaytime(60_806_258)).toBe("16h 53m");
    expect(formatPlaytime(3_600_000)).toBe("1h 0m");
  });

  test("extractCurrencies normalizes game resources to UI currencies", () => {
    expect(extractCurrencies(undefined)).toBeUndefined();
    expect(extractCurrencies({})).toBeUndefined();
    expect(
      extractCurrencies({
        gold: 102370,
        fluxite: 1177,
        artifacts: 7,
        lumlings: 0,
      }),
    ).toEqual({
      credits: 102370,
      fluxite: 1177,
      artifact: 7,
    });
    expect(
      extractCurrencies({
        credits: 500,
        artifact: 1,
      }),
    ).toEqual({
      credits: 500,
      fluxite: undefined,
      artifact: 1,
    });
  });

  test("formatProductionPoints formats compact numbers correctly", () => {
    expect(formatProductionPoints(undefined)).toBeUndefined();
    expect(formatProductionPoints(0)).toBeUndefined();
    expect(formatProductionPoints(-10)).toBeUndefined();
    expect(formatProductionPoints(42)).toBe("42");
    expect(formatProductionPoints(999)).toBe("999");
    expect(formatProductionPoints(1000)).toMatch(/1(\.0)?[kK]/);
    expect(formatProductionPoints(296032)).toMatch(/296(\.0)?[kK]/);
  });
});
