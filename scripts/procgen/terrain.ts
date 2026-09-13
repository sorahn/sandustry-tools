export type CapturedTerrainPayload = {
  seed: string;
  version: string;
  width: number;
  height: number;
  matrix: number[];
  transientCellsHandled: number;
};

/**
 * Pure RLE encoder for a flat 2D cell ID array.
 * Values <= 0 are treated as 0 (empty/sky).
 * Values 1..1000 are valid terrain IDs.
 * Values > 1000 are transient element/slot handles in the live simulation and normalized to 0.
 */
export function encodeCellIdsToRle(
  cellIds: ArrayLike<number>,
  expectedLength: number,
): { matrix: number[]; transientCount: number } {
  if (expectedLength <= 0) {
    return { matrix: [], transientCount: 0 };
  }
  if (cellIds.length < expectedLength) {
    throw new Error(
      `cellIds length (${cellIds.length}) is smaller than expectedLength (${expectedLength})`,
    );
  }

  const matrix: number[] = [];
  let transientCount = 0;

  const normalizeCell = (raw: number): number => {
    if (raw <= 0) return 0;
    if (raw <= 1000) return raw;
    transientCount++;
    return 0;
  };

  let currentVal = normalizeCell(cellIds[0]);
  let currentCount = 1;

  for (let i = 1; i < expectedLength; i++) {
    const val = normalizeCell(cellIds[i]);
    if (val === currentVal) {
      currentCount++;
    } else {
      matrix.push(currentVal, currentCount);
      currentVal = val;
      currentCount = 1;
    }
  }
  matrix.push(currentVal, currentCount);

  return { matrix, transientCount };
}

/**
 * Evaluated in the Chromium renderer via CDP.
 * Reads the active simulation state from `sandkit.engine.state`,
 * extracts dimensions and seed, and RLE-encodes `shared.sim.cellIds`.
 */
export function readRendererTerrainRle(): CapturedTerrainPayload {
  const g = globalThis as typeof globalThis & {
    sandkit?: {
      engine?: {
        state?: {
          store?: {
            world?: { size?: { width?: number; height?: number } };
            meta?: { seed?: string };
            version?: string;
          };
          shared?: {
            sim?: {
              cellIds?: ArrayLike<number>;
              width?: number;
              height?: number;
            };
          };
        };
      };
    };
  };
  const sk = typeof sandkit !== "undefined" ? (sandkit as typeof g.sandkit) : g.sandkit;
  const state = sk?.engine?.state;
  if (!state) {
    throw new Error("sandkit.engine.state is not available");
  }

  const store = state.store ?? {};
  const worldSize = store.world?.size;
  const sim = state.shared?.sim;

  const width =
    typeof worldSize?.width === "number" && worldSize.width > 0
      ? worldSize.width
      : typeof sim?.width === "number" && sim.width > 0
        ? sim.width
        : 0;

  const height =
    typeof worldSize?.height === "number" && worldSize.height > 0
      ? worldSize.height
      : typeof sim?.height === "number" && sim.height > 0
        ? sim.height
        : 0;

  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid world dimensions: ${width}x${height}`);
  }

  const expectedLength = width * height;
  const cellIds = sim?.cellIds;
  if (!cellIds || cellIds.length < expectedLength) {
    throw new Error(
      `sim.cellIds length (${cellIds ? cellIds.length : 0}) does not match expected length (${expectedLength})`,
    );
  }

  const seed = String(store.meta?.seed ?? "");
  const version = typeof store.version === "string" ? store.version : "0.5.6";

  const matrix: number[] = [];
  let transientCount = 0;

  let currentVal = 0;
  const first = cellIds[0];
  if (first > 0 && first <= 1000) {
    currentVal = first;
  } else if (first > 1000) {
    transientCount++;
  }
  let currentCount = 1;

  for (let i = 1; i < expectedLength; i++) {
    const raw = cellIds[i];
    let val = 0;
    if (raw > 0 && raw <= 1000) {
      val = raw;
    } else if (raw > 1000) {
      transientCount++;
    }

    if (val === currentVal) {
      currentCount++;
    } else {
      matrix.push(currentVal, currentCount);
      currentVal = val;
      currentCount = 1;
    }
  }
  matrix.push(currentVal, currentCount);

  return {
    seed,
    version,
    width,
    height,
    matrix,
    transientCellsHandled: transientCount,
  };
}
