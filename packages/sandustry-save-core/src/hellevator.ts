import { isPassableMatrixValue, saveExplorerTerrainName, saveExplorerElementName } from "./catalog";

export interface HellevatorSaveDocument {
  payload: {
    matrix: unknown[];
    store?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface HellevatorShaft {
  rank: number;
  startX: number;
  endX: number;
  width: number;
  startY: number;
  endY: number;
  length: number;
  surfaceY: number;
  undergroundDepth: number;
  reachesSurface: boolean;
  reachesBedrock: boolean;

  // Blueprint / minimap tile coordinates (1 tile = 4 cells = 16 native pixels)
  tileX: number;
  tileEndX: number;
  tileWidth: number;
  tileStartY: number;
  tileEndY: number;
  tileLength: number;
  tileUndergroundDepth: number;

  // Breakdown of cell materials within the shaft
  composition?: Record<string, number>;
}

export interface HellevatorScanOptions {
  /** Minimum shaft width in cells (default: 4 cells = 1 blueprint tile = 16px). */
  minWidth?: number;
  /** Minimum vertical shaft depth in cells to consider (default: 100 cells = 25 tiles). */
  minLength?: number;
  /** Maximum number of top shafts to return (default: 10). */
  topK?: number;
  /** If true, only return shafts that reach the ground surface or open sky (default: false). */
  surfaceOnly?: boolean;
  /** Suppression padding in cells between distinct shaft corridors (default: 32 cells = 8 tiles). */
  clusterDistance?: number;
  /** Primary ranking criteria: "underground" depth or "total" depth (default: "underground"). */
  ranking?: "underground" | "total";
  /** Optional border margin in cells to exclude from the left/right map edges (default: 0). */
  excludeEdgeMargin?: number;
  /** Maximum number of full-height shafts (> fullHeightThresholdTiles) to select before forcing shorter shafts (default: 2). */
  maxFullHeightShafts?: number;
  /** Tile length threshold to define a "full-height" shaft (default: 950 tiles = 3800 cells). */
  fullHeightThresholdTiles?: number;
}

export interface HellevatorScanResult {
  worldWidth: number;
  worldHeight: number;
  options: Required<HellevatorScanOptions>;
  shafts: HellevatorShaft[];
}

type RawShaftRun = {
  x: number;
  startY: number;
  endY: number;
  length: number;
};

/**
 * Extracts world dimensions from a SaveGameDocument or dimension object.
 */
function extractWorldDimensions(
  input: { matrix: unknown[]; width?: number; height?: number } | HellevatorSaveDocument,
): { width: number; height: number; matrix: unknown[] } {
  if ("payload" in input && typeof input.payload === "object" && input.payload !== null) {
    const matrix = input.payload.matrix;
    if (!Array.isArray(matrix)) {
      throw new Error("Invalid save document: missing payload.matrix");
    }
    const world = input.payload.store?.world as
      | { size?: { width?: number; height?: number } }
      | undefined;
    const width = world?.size?.width ?? 3840;
    const height = world?.size?.height ?? 3840;
    return { width, height, matrix };
  }

  const { matrix, width, height } = input as { matrix: unknown[]; width?: number; height?: number };
  if (!Array.isArray(matrix)) {
    throw new Error("Invalid input: matrix must be an array");
  }
  return {
    width: typeof width === "number" && width > 0 ? width : 3840,
    height: typeof height === "number" && height > 0 ? height : 3840,
    matrix,
  };
}

/**
 * Scans a Sandustry terrain matrix for the longest vertical shafts of penetrable terrain
 * suitable for building a hellevator.
 */
export function scanHellevatorShafts(
  input: { matrix: unknown[]; width?: number; height?: number } | HellevatorSaveDocument,
  options: HellevatorScanOptions = {},
): HellevatorScanResult {
  const { width, height, matrix } = extractWorldDimensions(input);

  const resolvedOptions: Required<HellevatorScanOptions> = {
    minWidth: options.minWidth ?? 4,
    minLength: options.minLength ?? 100,
    topK: options.topK ?? 10,
    surfaceOnly: options.surfaceOnly ?? false,
    clusterDistance: options.clusterDistance ?? 32,
    ranking: options.ranking ?? "underground",
    excludeEdgeMargin: options.excludeEdgeMargin ?? 0,
    maxFullHeightShafts: options.maxFullHeightShafts ?? 2,
    fullHeightThresholdTiles: options.fullHeightThresholdTiles ?? 950,
  };

  const {
    minWidth,
    minLength,
    topK,
    surfaceOnly,
    clusterDistance,
    ranking,
    excludeEdgeMargin,
    maxFullHeightShafts,
    fullHeightThresholdTiles,
  } = resolvedOptions;

  const totalCells = width * height;
  const passable = new Uint8Array(totalCells);
  const cellValues = new Int16Array(totalCells);
  const surfaceY = new Int32Array(width);
  surfaceY.fill(-1);

  // 1. Expand RLE matrix and mark penetrable cells + detect surface Y per column
  let cursor = 0;
  for (let i = 0; i < matrix.length; i += 2) {
    const rawVal = matrix[i];
    const count = matrix[i + 1] as number;
    if (typeof count !== "number" || count <= 0) continue;

    const ok = isPassableMatrixValue(rawVal) ? 1 : 0;
    const end = Math.min(totalCells, cursor + count);
    passable.fill(ok, cursor, end);

    // Raw code for composition tracking: 0 = air, >0 = terrain/element
    let code = 0;
    if (typeof rawVal === "number") code = rawVal;
    else if (typeof rawVal === "object" && rawVal !== null) {
      const type = (rawVal as Record<string, unknown>).type;
      code = typeof type === "number" ? type + 100 : 101;
    }
    cellValues.fill(code, cursor, end);

    if (code !== 0) {
      for (let c = cursor; c < end; c++) {
        const x = c % width;
        const y = Math.floor(c / width);
        if (surfaceY[x] === -1 || y < surfaceY[x]) {
          surfaceY[x] = y;
        }
      }
    }

    cursor = end;
    if (cursor >= totalCells) break;
  }

  // 2. Scan each column for continuous vertical runs of width minWidth
  const rawRuns: RawShaftRun[] = [];
  const startCol = Math.max(0, excludeEdgeMargin);
  const endCol = Math.min(width - minWidth, width - 1 - excludeEdgeMargin);

  for (let x = startCol; x <= endCol; x++) {
    let runStart = -1;
    for (let y = 0; y < height; y++) {
      let rowPassable = true;
      const rowOffset = y * width;
      for (let dx = 0; dx < minWidth; dx++) {
        if (passable[rowOffset + x + dx] === 0) {
          rowPassable = false;
          break;
        }
      }

      if (rowPassable) {
        if (runStart === -1) runStart = y;
      } else {
        if (runStart !== -1) {
          const len = y - runStart;
          if (len >= minLength) {
            rawRuns.push({ x, startY: runStart, endY: y - 1, length: len });
          }
          runStart = -1;
        }
      }
    }

    if (runStart !== -1) {
      const len = height - runStart;
      if (len >= minLength) {
        rawRuns.push({ x, startY: runStart, endY: height - 1, length: len });
      }
    }
  }

  // Helper to score and rank candidate runs
  const getUndergroundDepth = (startY: number, endY: number, sY: number) => {
    return Math.max(0, endY - Math.max(startY, sY) + 1);
  };

  rawRuns.sort((a, b) => {
    const sYa = surfaceY[a.x] === -1 ? 0 : surfaceY[a.x];
    const sYb = surfaceY[b.x] === -1 ? 0 : surfaceY[b.x];
    const undA = getUndergroundDepth(a.startY, a.endY, sYa);
    const undB = getUndergroundDepth(b.startY, b.endY, sYb);

    if (ranking === "underground") {
      if (undB !== undA) return undB - undA;
      return b.length - a.length;
    } else {
      if (b.length !== a.length) return b.length - a.length;
      return undB - undA;
    }
  });

  // 3. Cluster runs into maximal-width shafts and suppress overlapping columns
  const usedColumns = new Uint8Array(width);
  const selectedShafts: HellevatorShaft[] = [];

  for (const run of rawRuns) {
    if (usedColumns[run.x] === 1) continue;

    // Check surface constraint if surfaceOnly is active
    const estSurf = surfaceY[run.x] === -1 ? 0 : surfaceY[run.x];
    if (surfaceOnly && run.startY > estSurf) {
      continue;
    }

    // Expand width to left
    let leftX = run.x;
    while (leftX > startCol && usedColumns[leftX - 1] === 0) {
      let colPassable = true;
      const targetCol = leftX - 1;
      for (let y = run.startY; y <= run.endY; y++) {
        if (passable[y * width + targetCol] === 0) {
          colPassable = false;
          break;
        }
      }
      if (!colPassable) break;
      leftX--;
    }

    // Expand width to right up to world boundary (excluding edge margin)
    const maxRightCol = width - 1 - excludeEdgeMargin;
    let rightX = run.x + minWidth - 1;
    while (rightX < maxRightCol && usedColumns[rightX + 1] === 0) {
      let colPassable = true;
      const targetCol = rightX + 1;
      for (let y = run.startY; y <= run.endY; y++) {
        if (passable[y * width + targetCol] === 0) {
          colPassable = false;
          break;
        }
      }
      if (!colPassable) break;
      rightX++;
    }

    const totalWidth = rightX - leftX + 1;
    if (totalWidth >= minWidth) {
      // Average surface Y across this shaft corridor
      let sumSurf = 0;
      let countSurf = 0;
      for (let c = leftX; c <= rightX; c++) {
        if (surfaceY[c] !== -1) {
          sumSurf += surfaceY[c];
          countSurf++;
        }
      }
      const avgSurfaceY = countSurf > 0 ? Math.round(sumSurf / countSurf) : 0;
      const undergroundDepth = getUndergroundDepth(run.startY, run.endY, avgSurfaceY);
      const reachesSurface = run.startY <= avgSurfaceY;

      if (surfaceOnly && !reachesSurface) {
        continue;
      }

      selectedShafts.push({
        rank: 0,
        startX: leftX,
        endX: rightX,
        width: totalWidth,
        startY: run.startY,
        endY: run.endY,
        length: run.length,
        surfaceY: avgSurfaceY,
        undergroundDepth,
        reachesSurface,
        reachesBedrock: run.endY >= height - 50,
        tileX: leftX / 4,
        tileEndX: rightX / 4,
        tileWidth: totalWidth / 4,
        tileStartY: run.startY / 4,
        tileEndY: run.endY / 4,
        tileLength: run.length / 4,
        tileUndergroundDepth: undergroundDepth / 4,
      });

      // Suppress nearby columns from repeating this corridor
      const padStart = Math.max(startCol, leftX - clusterDistance);
      const padEnd = Math.min(endCol, rightX + clusterDistance);
      for (let c = padStart; c <= padEnd; c++) {
        usedColumns[c] = 1;
      }
    }
  }

  // Sort candidate shafts: depth first, then width descending on ties
  selectedShafts.sort((a, b) => {
    const depthA = ranking === "underground" ? a.undergroundDepth : a.length;
    const depthB = ranking === "underground" ? b.undergroundDepth : b.length;

    if (depthB !== depthA) {
      return depthB - depthA;
    }

    // Tie-breaker 1: width descending (wider corridor ranks higher)
    if (b.width !== a.width) {
      return b.width - a.width;
    }

    // Tie-breaker 2: secondary depth
    const secA = ranking === "underground" ? a.length : a.undergroundDepth;
    const secB = ranking === "underground" ? b.length : b.undergroundDepth;
    if (secB !== secA) {
      return secB - secA;
    }

    return a.startX - b.startX;
  });

  // Separate full-height shafts (> fullHeightThresholdTiles) from shorter interior shafts.
  // For full-height shafts, prioritize the widest corridors found across the entire map.
  const fullShafts: HellevatorShaft[] = [];
  const shorterShafts: HellevatorShaft[] = [];

  for (const shaft of selectedShafts) {
    if (shaft.tileLength > fullHeightThresholdTiles) {
      fullShafts.push(shaft);
    } else {
      shorterShafts.push(shaft);
    }
  }

  // Sort full-height shafts primarily by width descending, breaking ties with underground/total depth
  fullShafts.sort((a, b) => {
    if (b.width !== a.width) {
      return b.width - a.width;
    }
    const depthA = ranking === "underground" ? a.undergroundDepth : a.length;
    const depthB = ranking === "underground" ? b.undergroundDepth : b.length;
    if (depthB !== depthA) {
      return depthB - depthA;
    }
    return a.startX - b.startX;
  });

  // Select up to maxFullHeightShafts from the widest full-height shafts, then fill
  // remaining slots from the best shorter interior shafts.
  const finalShafts: HellevatorShaft[] = [];
  const fullToTake = fullShafts.slice(0, maxFullHeightShafts);
  finalShafts.push(...fullToTake);

  const remainingNeeded = topK - finalShafts.length;
  if (remainingNeeded > 0) {
    finalShafts.push(...shorterShafts.slice(0, remainingNeeded));
  }

  // If we still haven't reached topK (e.g. fewer shorter shafts exist on the map),
  // backfill with any remaining full-height shafts (widest first).
  if (finalShafts.length < topK) {
    const remainingFull = fullShafts.slice(maxFullHeightShafts);
    finalShafts.push(...remainingFull.slice(0, topK - finalShafts.length));
  }

  // Compute composition only for the top finalists
  for (const shaft of finalShafts) {
    const counts: Record<string, number> = {};
    let totalSampled = 0;
    for (let y = shaft.startY; y <= shaft.endY; y++) {
      const rowOffset = y * width;
      for (let x = shaft.startX; x <= shaft.endX; x++) {
        const code = cellValues[rowOffset + x];
        let name = "Air";
        if (code !== 0) {
          if (code >= 101) {
            name = saveExplorerElementName(code - 100) ?? "Element";
          } else if (code > 0) {
            name = saveExplorerTerrainName(code) ?? "Terrain";
          }
        }
        counts[name] = (counts[name] ?? 0) + 1;
        totalSampled++;
      }
    }

    const composition: Record<string, number> = {};
    for (const [name, count] of Object.entries(counts)) {
      composition[name] = Math.round((count / totalSampled) * 1000) / 10;
    }
    shaft.composition = composition;
  }

  // Update ranks
  for (let i = 0; i < finalShafts.length; i++) {
    finalShafts[i].rank = i + 1;
  }

  return {
    worldWidth: width,
    worldHeight: height,
    options: resolvedOptions,
    shafts: finalShafts,
  };
}
