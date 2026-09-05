import type { SaveBlueprintSummary } from "@sandustry/save-core";
import { forgetRememberedSave, readRememberedSave } from "./save-storage";
import { readStorageValue, removeStorageValue, writeStorageValue } from "./storage";

export const SAVE_DATABASE_NAME = "sandustry-save-explorer-db";
export const SAVE_DATABASE_VERSION = 1;
const SUMMARY_STORE = "saveSummaries";
const BLOB_STORE = "saveBlobs";
export const ACTIVE_SAVE_ID_KEY = "sandustry-save-explorer-active-save";

export type StoredSaveSummary = {
  id: string;
  fileName: string;
  saveName?: string;
  worldName?: string;
  playTime?: number;
  saveTimestamp?: string;
  storedAt: string;
  gameVersion?: string;
  factoryLevel?: number;
  productionPoints?: number;
  resources?: Record<string, number>;
  structureCount: number;
  blueprintCount: number;
  byteLength: number;
  blueprints: SaveBlueprintSummary[];
};

export function formatProductionPoints(points?: number): string | undefined {
  if (points === undefined || !Number.isFinite(points) || points <= 0) return undefined;
  if (points >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(points);
  }
  return points.toLocaleString();
}

export function formatPlaytime(ms?: number): string | undefined {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return undefined;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

export function extractCurrencies(resources?: Record<string, number>):
  | {
      credits?: number;
      fluxite?: number;
      artifact?: number;
    }
  | undefined {
  if (!resources) return undefined;
  const credits = resources.gold ?? resources.credits;
  const fluxite = resources.fluxite;
  const artifact = resources.artifacts ?? resources.artifact;
  if (credits === undefined && fluxite === undefined && artifact === undefined) {
    return undefined;
  }
  return { credits, fluxite, artifact };
}

export type SaveStorageErrorCode =
  | "unavailable"
  | "quota"
  | "transaction-aborted"
  | "corrupt-record";

export type SaveStorageError = {
  code: SaveStorageErrorCode;
  message: string;
  cause?: unknown;
};

export type StorageResult<T> = { ok: true; value: T } | { ok: false; error: SaveStorageError };

export type SaveDatabaseEvent =
  | { type: "save-stored"; summary: StoredSaveSummary }
  | { type: "save-deleted"; saveId: string }
  | { type: "active-save-changed"; saveId: string | null };

type SaveDatabaseListener = (event: SaveDatabaseEvent) => void;

const databaseListeners = new Set<SaveDatabaseListener>();

export function subscribeToSaveDatabase(listener: SaveDatabaseListener): () => void {
  databaseListeners.add(listener);
  return () => {
    databaseListeners.delete(listener);
  };
}

export function notifySaveDatabase(event: SaveDatabaseEvent): void {
  for (const listener of Array.from(databaseListeners)) {
    try {
      listener(event);
    } catch {
      // Listeners must not make save persistence fail.
    }
  }
}

export function readActiveSaveId(): string | null {
  return readStorageValue(ACTIVE_SAVE_ID_KEY);
}

export function setActiveSaveId(saveId: string | null): void {
  if (saveId) writeStorageValue(ACTIVE_SAVE_ID_KEY, saveId);
  else removeStorageValue(ACTIVE_SAVE_ID_KEY);
  notifySaveDatabase({ type: "active-save-changed", saveId });
}

function failure(
  code: SaveStorageErrorCode,
  message: string,
  cause?: unknown,
): StorageResult<never> {
  return { ok: false, error: { code, message, cause } };
}

function storageError(error: unknown, fallback: string): SaveStorageError {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError")
    return { code: "quota", message: "Save storage quota exceeded", cause: error };
  if (name === "AbortError")
    return { code: "transaction-aborted", message: fallback, cause: error };
  return { code: "transaction-aborted", message: fallback, cause: error };
}

function databaseAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<StorageResult<IDBDatabase>> {
  if (!databaseAvailable())
    return Promise.resolve(failure("unavailable", "IndexedDB is unavailable"));
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(SAVE_DATABASE_NAME, SAVE_DATABASE_VERSION);
    } catch (error) {
      resolve(failure("unavailable", "Unable to open IndexedDB", error));
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SUMMARY_STORE))
        database.createObjectStore(SUMMARY_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(BLOB_STORE))
        database.createObjectStore(BLOB_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve({ ok: true, value: request.result });
    request.onerror = () =>
      resolve(failure("unavailable", "Unable to open IndexedDB", request.error));
    request.onblocked = () =>
      resolve(failure("transaction-aborted", "IndexedDB upgrade is blocked"));
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<StorageResult<T>> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve({ ok: true, value: request.result });
    request.onerror = () =>
      resolve({ ok: false, error: storageError(request.error, "IndexedDB request failed") });
  });
}

export async function storeSave(
  bytes: Uint8Array,
  summary: StoredSaveSummary,
): Promise<StorageResult<void>> {
  const opened = await openDatabase();
  if (!opened.ok) return opened;
  const database = opened.value;
  try {
    const transaction = database.transaction([SUMMARY_STORE, BLOB_STORE], "readwrite");
    transaction.objectStore(SUMMARY_STORE).put(summary);
    transaction
      .objectStore(BLOB_STORE)
      .put({ id: summary.id, bytes: new Blob([new Uint8Array(bytes)]) });
    const result = await new Promise<StorageResult<void>>((resolve) => {
      transaction.oncomplete = () => resolve({ ok: true, value: undefined });
      transaction.onerror = () =>
        resolve({ ok: false, error: storageError(transaction.error, "Unable to store save") });
      transaction.onabort = () =>
        resolve({
          ok: false,
          error: storageError(transaction.error, "Save storage transaction aborted"),
        });
    });
    if (result.ok) {
      setActiveSaveId(summary.id);
      notifySaveDatabase({ type: "save-stored", summary });
    }
    return result;
  } catch (error) {
    return failure("transaction-aborted", "Unable to store save", error);
  } finally {
    database.close();
  }
}

export async function listSavedGames(): Promise<StorageResult<StoredSaveSummary[]>> {
  const opened = await openDatabase();
  if (!opened.ok) return opened;
  const database = opened.value;
  try {
    const result = await requestValue<StoredSaveSummary[]>(
      database.transaction(SUMMARY_STORE, "readonly").objectStore(SUMMARY_STORE).getAll(),
    );
    if (result.ok) {
      result.value.sort((a, b) => {
        const timeB = new Date(b.storedAt || b.saveTimestamp || 0).getTime();
        const timeA = new Date(a.storedAt || a.saveTimestamp || 0).getTime();
        return timeB - timeA;
      });
    }
    return result;
  } finally {
    database.close();
  }
}

export async function getSavedGameBytes(saveId: string): Promise<StorageResult<Uint8Array>> {
  const opened = await openDatabase();
  if (!opened.ok) return opened;
  const database = opened.value;
  try {
    const result = await requestValue<{ id: string; bytes: Blob | ArrayBuffer } | undefined>(
      database.transaction(BLOB_STORE, "readonly").objectStore(BLOB_STORE).get(saveId),
    );
    if (!result.ok) return result;
    if (!result.value) return failure("corrupt-record", `Stored save ${saveId} is missing`);
    if (result.value.bytes instanceof Blob)
      return { ok: true, value: new Uint8Array(await result.value.bytes.arrayBuffer()) };
    if (result.value.bytes instanceof ArrayBuffer)
      return { ok: true, value: new Uint8Array(result.value.bytes.slice(0)) };
    return failure("corrupt-record", `Stored save ${saveId} has invalid bytes`);
  } finally {
    database.close();
  }
}

export async function deleteSavedGame(saveId: string): Promise<StorageResult<void>> {
  const opened = await openDatabase();
  if (!opened.ok) return opened;
  const database = opened.value;
  try {
    const transaction = database.transaction([SUMMARY_STORE, BLOB_STORE], "readwrite");
    transaction.objectStore(SUMMARY_STORE).delete(saveId);
    transaction.objectStore(BLOB_STORE).delete(saveId);
    const result = await new Promise<StorageResult<void>>((resolve) => {
      transaction.oncomplete = () => resolve({ ok: true, value: undefined });
      transaction.onerror = () =>
        resolve({ ok: false, error: storageError(transaction.error, "Unable to delete save") });
      transaction.onabort = () =>
        resolve({
          ok: false,
          error: storageError(transaction.error, "Save deletion transaction aborted"),
        });
    });
    if (result.ok) {
      if (readActiveSaveId() === saveId) setActiveSaveId(null);
      notifySaveDatabase({ type: "save-deleted", saveId });
    }
    return result;
  } catch (error) {
    return failure("transaction-aborted", "Unable to delete save", error);
  } finally {
    database.close();
  }
}

export async function estimateStoredBytes(): Promise<StorageResult<number>> {
  const listed = await listSavedGames();
  if (!listed.ok) return listed;
  const knownBytes = listed.value.reduce((total, summary) => total + summary.byteLength, 0);
  if (typeof navigator === "undefined" || !navigator.storage?.estimate)
    return { ok: true, value: knownBytes };
  try {
    const estimate = await navigator.storage.estimate();
    return { ok: true, value: Math.max(knownBytes, estimate.usage ?? 0) };
  } catch {
    return { ok: true, value: knownBytes };
  }
}

/** Migrate the old base64 localStorage record only after an IDB write/read-back succeeds. */
export async function migrateLegacyRememberedSave(
  decodedBytes: Uint8Array,
  summary: StoredSaveSummary,
): Promise<StorageResult<boolean>> {
  const legacy = readRememberedSave();
  if (!legacy) return { ok: true, value: false };
  if (
    decodedBytes.length !== legacy.bytes.length ||
    decodedBytes.some((byte, index) => byte !== legacy.bytes[index])
  )
    return failure("corrupt-record", "Legacy save changed before migration");
  const stored = await storeSave(legacy.bytes, summary);
  if (!stored.ok) return stored;
  const readBack = await getSavedGameBytes(summary.id);
  if (!readBack.ok) return readBack;
  if (
    readBack.value.length !== legacy.bytes.length ||
    readBack.value.some((byte, index) => byte !== legacy.bytes[index])
  )
    return failure("corrupt-record", `Migrated save ${summary.id} failed verification`);
  forgetRememberedSave();
  return { ok: true, value: true };
}
