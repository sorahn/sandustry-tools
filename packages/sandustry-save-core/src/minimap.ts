import {
  decodeDamagedTerrainValue,
  expandRunLengthPairs,
  type SaveGameDocument,
  type SaveGamePayload,
} from "./index";
import { SAVE_EXPLORER_LAYER_ORDER, type SaveExplorerRenderLayer } from "./layers";

export const MINIMAP_CELL_SIZE = 4;
export const SKY_COLOR: RgbaColor = [72, 200, 255, 255];
export const FOG_COLOR: RgbaColor = [0, 0, 0, 255];
const ELEMENT_MATRIX_MIN = 101;

export type RgbaColor = readonly [red: number, green: number, blue: number, alpha: number];

export type MinimapRaster = {
  width: number;
  height: number;
  /** Row-major RGBA pixels, suitable for ImageData or a Canvas ImageData-compatible buffer. */
  pixels: Uint8ClampedArray;
};

export type MinimapRenderOptions = {
  cellSize?: number;
  drawTerrain?: boolean;
  drawSettledElements?: boolean;
  drawElements?: boolean;
  drawParticles?: boolean;
  drawFog?: boolean;
  drawTerrainFog?: boolean;
  drawStructures?: boolean;
  drawWalls?: boolean;
  drawAuthorization?: boolean;
  palette?: Readonly<Record<number, RgbaColor>>;
  structureColor?: RgbaColor;
  structurePalette?: Readonly<Record<string, RgbaColor>>;
  wallColor?: RgbaColor;
  authorizationColor?: RgbaColor;
};

export type PreparedMinimapStructure = {
  x: number;
  y: number;
  type: string | number;
  color?: string;
};

export type PreparedSaveExplorerRenderState = {
  worldWidth: number;
  worldHeight: number;
  width: number;
  height: number;
  cellSize: number;
  terrainValues: Int32Array;
  settledElementValues: Int32Array;
  elementValues: Int32Array;
  particleValues: Int32Array;
  fog: Uint8Array;
  walls: Uint8Array;
  authorization: Uint8Array;
  wallPalette: unknown[];
  structures: PreparedMinimapStructure[];
  inspectionValues: unknown[];
  structuresByCell: Map<number, PreparedMinimapStructure[]>;
};

const DEFAULT_STRUCTURE_PALETTE: Readonly<Record<string, RgbaColor>> = {
  // Representative colors for common catalog structures; unknown types use
  // the configured fallback marker color.
  "11": [165, 165, 165, 255], // Foundation
  "16": [101, 240, 0, 255], // Collector (#65f000 in the game minimap)
};

export const DEFAULT_PALETTE: Readonly<Record<number, RgbaColor>> = {
  // CellType values from the captured Sandustry enum.
  1: [186, 186, 186, 255], // Element fallback
  2: [105, 76, 43, 255], // Dirt
  3: [90, 73, 53, 255], // Sporemound
  4: [20, 25, 30, 255], // Fog fallback
  5: [45, 56, 63, 255], // Fog jetpack block
  6: [80, 190, 255, 255], // Water (Fog) - aligned to Water
  7: [195, 225, 240, 255], // Frostbed
  8: [100, 100, 100, 255], // Divider
  9: [83, 158, 54, 255], // Grass
  10: [66, 118, 62, 255], // Moss
  11: [176, 139, 59, 255], // Gold soil
  12: [255, 105, 180, 255], // Petal (#ff69b4)
  13: [255, 90, 54, 255], // Lava (Fog) - aligned to Lava
  14: [75, 162, 193, 255], // Fluxite
  15: [126, 126, 126, 255], // Block
  16: [150, 150, 150, 255], // Sliding block
  17: [150, 150, 150, 255], // Sliding block left
  18: [150, 150, 150, 255], // Sliding block right
  19: [229, 159, 24, 255], // Conveyor left
  20: [229, 159, 24, 255], // Conveyor right
  23: [112, 112, 112, 255], // Stone
  24: [90, 90, 100, 255], // Kinetic press
  25: [197, 232, 245, 255], // Ice
  26: [104, 168, 75, 255], // Grower
  27: [101, 181, 209, 255], // Nascent water
  28: [117, 84, 44, 255], // Redsoil
  29: [67, 67, 76, 255], // Scoria
  30: [90, 86, 80, 255], // Crackstone
  31: [224, 165, 16, 255], // Solidite (HSL 43, 87, 47 / #de9d10)
  32: [77, 31, 122, 255], // Void flower soil (HSL 270, 60, 30)
  33: [150, 50, 180, 255], // Spreading terrain
  34: [180, 180, 50, 255], // Sand2
  35: [107, 142, 35, 255], // Earth strataform
  36: [0, 255, 0, 255], // Game of Life (R)
  37: [0, 204, 204, 255], // GoL (R)(H)
  38: [0, 148, 179, 255], // Mooncrystal (#0094b3)
  39: [194, 187, 120, 255], // Sandstone (pattern base HSL 52, 43, 60)
  40: [240, 219, 117, 255], // Dune (terrain id resolved by Debug Lab)
  41: [255, 223, 0, 255], // Pyramid terrain core (#ffdf00 in the game minimap)
  42: [34, 34, 34, 255], // Bedrock (#222222 / HSL 0, 0, 55)
  43: [0, 255, 0, 255], // Game of Life (S)
  44: [184, 115, 51, 255], // Copper ore (HSL 20, 60, 35 / #ffa500)
  45: [25, 230, 128, 255], // Glass (HSL 150, 80, 50 / #19e680)
  46: [74, 55, 40, 255], // Brittle clay (#4a3728)
  47: [139, 115, 85, 255], // Puff (#8b7355)
  48: [199, 235, 255, 255], // Snow (Fog) - aligned to Snow
  49: [20, 20, 20, 255], // Blackrock (#141414)
  50: [102, 51, 153, 255], // Florinol soil (HSL 270, 50, 40 / #339999)
  51: [74, 64, 176, 255], // Auralite crystal (HSL 250, 60, 50 / #4a40b0)
  52: [91, 206, 34, 255], // Vine (HSL 100, 72, 47)
  53: [255, 72, 0, 255], // Caldera (HSL 17, 100, 50)
  54: [182, 188, 193, 255], // Shatterstone (HSL 207, 8, 73 / #b6bcc1)
  55: [24, 28, 32, 255], // Deepstone (HSL 210, 14, 11 / #181c20)
  // ElementType values are represented in the saved matrix as type + 100.
  101: [222, 190, 122, 255], // Sand
  102: [188, 188, 188, 255], // Particle
  103: [80, 190, 255, 255], // Water
  104: [177, 142, 104, 255], // Wet sand
  105: [204, 65, 48, 255], // Redsand
  106: [123, 101, 83, 255], // Residue
  107: [255, 207, 54, 255], // Gold
  108: [142, 32, 188, 255], // Voidbloom
  109: [194, 194, 194, 255], // Shake
  110: [221, 221, 238, 255], // Steam
  111: [255, 91, 28, 255], // Fire
  112: [199, 235, 255, 255], // Snow
  113: [255, 125, 46, 255], // Flame
  114: [92, 63, 48, 255], // Burnt residue
  115: [133, 197, 83, 255], // Seed
  116: [116, 178, 72, 255], // Wet seed
  117: [91, 198, 93, 255], // Seedling
  118: [240, 107, 187, 255], // Amethelis
  119: [255, 90, 54, 255], // Lava
  120: [92, 92, 102, 255], // Cinder
};

function storeValue(payload: SaveGamePayload, path: string[]) {
  let value: unknown = payload.store;
  for (const key of path) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function worldDimensions(payload: SaveGamePayload) {
  const size = storeValue(payload, ["world", "size"]);
  if (typeof size !== "object" || size === null)
    throw new Error("Save is missing world dimensions");
  const width = (size as Record<string, unknown>).width;
  const height = (size as Record<string, unknown>).height;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Save has invalid world dimensions");
  }
  return { width, height };
}

function matrixValueCode(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "object" || value === null) return 0;
  const record = value as Record<string, unknown>;
  const type = record.type;
  return typeof type === "number" ? type + 100 : 1;
}

function copyColor(target: Uint8ClampedArray, offset: number, color: RgbaColor) {
  target[offset] = color[0];
  target[offset + 1] = color[1];
  target[offset + 2] = color[2];
  target[offset + 3] = color[3];
}

function structureColorFor(
  type: unknown,
  fallback: RgbaColor,
  palette: Readonly<Record<string, RgbaColor>>,
) {
  return palette[String(type)] || fallback;
}

function parseStructureColor(value: unknown): RgbaColor | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^#([0-9a-f]{6})(?:([0-9a-f]{2}))?$/i.exec(value);
  if (!match) return undefined;
  const rgb = Number.parseInt(match[1], 16);
  const alpha = match[2] ? Number.parseInt(match[2], 16) : 255;
  return [(rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255, alpha];
}

function colorForValue(
  value: number,
  palette: Readonly<Record<number, RgbaColor>>,
  unknownFallback?: RgbaColor,
) {
  const damaged = decodeDamagedTerrainValue(value);
  const color =
    palette[damaged?.cellType ?? value] ||
    (value >= 100 ? (unknownFallback ?? [210, 210, 210, 255]) : [105, 105, 105, 255]);
  return color;
}

function fogBufferFor(payload: SaveGamePayload, width: number, height: number) {
  const map = storeValue(payload, ["mods", "map"]);
  if (typeof map !== "object" || map === null) return new Uint8Array(width * height).fill(255);
  const record = map as Record<string, unknown>;
  const encoded = record.fogBuffer;
  const fogWidth = record.fogWidth;
  const fogHeight = record.fogHeight;
  if (!Array.isArray(encoded) || fogWidth !== width || fogHeight !== height)
    return new Uint8Array(width * height).fill(255);
  if (record.fogBufferCompressed)
    return Uint8Array.from(expandRunLengthPairs<number>(encoded, width * height));
  if (encoded.length !== width * height) throw new Error("Invalid uncompressed fog buffer length");
  return Uint8Array.from(encoded, (value) => (typeof value === "number" ? value : 0));
}

function wallPaletteColor(data: unknown[], paletteIndex: number, fallback: RgbaColor) {
  if (!Array.isArray(data)) return fallback;
  const offset = paletteIndex * 4;
  if (offset < 0 || offset + 3 >= data.length) return fallback;
  const values = data.slice(offset, offset + 4);
  if (values.some((value) => typeof value !== "number")) return fallback;
  return values as unknown as RgbaColor;
}

function sectionedLayerBuffer(
  layer: SaveGameLayerLike | undefined,
  width: number,
  height: number,
  cellSize: number,
) {
  const tiles =
    layer && typeof layer.tiles === "object" && layer.tiles !== null
      ? (layer.tiles as Record<string, unknown>)
      : layer;
  const sections = tiles?.sections;
  const encoded = tiles?.data;
  const tileWidth = tiles?.width;
  const tileHeight = tiles?.height;
  if (
    !Array.isArray(sections) ||
    !Array.isArray(encoded) ||
    typeof tileWidth !== "number" ||
    typeof tileHeight !== "number" ||
    tileWidth <= 0 ||
    tileHeight <= 0
  )
    return new Uint8Array(width * height);
  const blockSize = 16;
  const blockColumns = Math.ceil(tileWidth / blockSize);
  const blockRows = Math.ceil(tileHeight / blockSize);
  const sectionIndexes = expandRunLengthPairs<number>(encoded, blockColumns * blockRows);
  const output = new Uint8Array(width * height);
  for (let block = 0; block < sectionIndexes.length; block++) {
    const section = sections[sectionIndexes[block]];
    if (!Array.isArray(section)) continue;
    const blockX = (block % blockColumns) * blockSize;
    const blockY = Math.floor(block / blockColumns) * blockSize;
    for (let local = 0; local < Math.min(section.length, blockSize * blockSize); local++) {
      const value = section[local];
      if (typeof value !== "number" || value === 0) continue;
      const worldX = blockX + (local % blockSize);
      const worldY = blockY + Math.floor(local / blockSize);
      if (worldX >= tileWidth || worldY >= tileHeight) continue;
      const outputIndex = Math.floor(worldY / cellSize) * width + Math.floor(worldX / cellSize);
      if (output[outputIndex] === 0) output[outputIndex] = value;
    }
  }
  return output;
}

type SaveGameLayerLike = SaveGamePayload["wall"];

function wallBufferFor(payload: SaveGamePayload, width: number, height: number, cellSize: number) {
  return sectionedLayerBuffer(payload.wall, width, height, cellSize);
}

function authorizationBufferFor(
  payload: SaveGamePayload,
  width: number,
  height: number,
  cellSize: number,
) {
  return sectionedLayerBuffer(payload.authorization, width, height, cellSize);
}

/** Prepare expensive world-derived minimap layers once per decoded save. */
export function prepareSaveExplorerRenderState(
  document: SaveGameDocument,
  options: Pick<MinimapRenderOptions, "cellSize"> = {},
): PreparedSaveExplorerRenderState {
  const { width: worldWidth, height: worldHeight } = worldDimensions(document.payload);
  const cellSize = options.cellSize ?? MINIMAP_CELL_SIZE;
  if (!Number.isSafeInteger(cellSize) || cellSize <= 0)
    throw new Error("Minimap cell size must be a positive integer");
  const width = Math.ceil(worldWidth / cellSize);
  const height = Math.ceil(worldHeight / cellSize);
  const terrainValues = new Int32Array(width * height);
  const settledElementValues = new Int32Array(width * height);
  const elementValues = new Int32Array(width * height);
  const particleValues = new Int32Array(width * height);
  const inspectionValues = Array.from<unknown>({ length: width * height });
  let position = 0;
  const encoded = document.payload.matrix;
  if (encoded.length % 2 !== 0) throw new Error("Invalid matrix: incomplete value/count pair");
  for (let index = 0; index < encoded.length; index += 2) {
    const rawValue = encoded[index];
    const value = matrixValueCode(rawValue);
    const kind =
      typeof rawValue === "number"
        ? rawValue >= ELEMENT_MATRIX_MIN
          ? 2
          : 1
        : typeof rawValue === "object" &&
            rawValue !== null &&
            (rawValue as Record<string, unknown>).particle === true
          ? 3
          : typeof rawValue === "object" && rawValue !== null
            ? (() => {
                const velocity = (rawValue as Record<string, unknown>).velocity;
                if (
                  typeof velocity === "object" &&
                  velocity !== null &&
                  typeof (velocity as Record<string, unknown>).x === "number" &&
                  typeof (velocity as Record<string, unknown>).y === "number" &&
                  ((velocity as Record<string, unknown>).x !== 0 ||
                    (velocity as Record<string, unknown>).y !== 0)
                )
                  return 4;
                return 2;
              })()
            : 2;
    const count = encoded[index + 1];
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0)
      throw new Error(`Invalid matrix count at pair ${index / 2}`);
    const end = position + count;
    if (end > worldWidth * worldHeight) throw new Error("Matrix exceeds world dimensions");
    if (value !== 0) {
      for (let cursor = position; cursor < end; cursor++) {
        const x = Math.floor((cursor % worldWidth) / cellSize);
        const y = Math.floor(Math.floor(cursor / worldWidth) / cellSize);
        const outputIndex = y * width + x;
        const target =
          kind === 1
            ? terrainValues
            : kind === 2
              ? settledElementValues
              : kind === 3
                ? particleValues
                : elementValues;
        if (target[outputIndex] === 0) target[outputIndex] = value;
        if (inspectionValues[outputIndex] === undefined) inspectionValues[outputIndex] = rawValue;
      }
    }
    position = end;
  }
  if (position !== worldWidth * worldHeight)
    throw new Error(`Matrix expanded to ${position}; expected ${worldWidth * worldHeight}`);

  const fog = fogBufferFor(document.payload, width, height);
  const walls = wallBufferFor(document.payload, width, height, cellSize);
  const authorization = authorizationBufferFor(document.payload, width, height, cellSize);
  const wall = document.payload.wall as Record<string, unknown> | undefined;
  const wallPalette =
    wall && typeof wall.palette === "object" && wall.palette !== null
      ? (wall.palette as Record<string, unknown>).data
      : [];
  const structures = Array.isArray(document.payload.store.structures)
    ? document.payload.store.structures.flatMap((value) => {
        if (typeof value !== "object" || value === null) return [];
        const record = value as Record<string, unknown>;
        return typeof record.x === "number" &&
          typeof record.y === "number" &&
          (typeof record.type === "string" || typeof record.type === "number")
          ? [
              {
                x: record.x,
                y: record.y,
                type: record.type,
                color: parseStructureColor(record.color) ? String(record.color) : undefined,
              },
            ]
          : [];
      })
    : [];
  const structuresByCell = new Map<number, PreparedMinimapStructure[]>();
  for (const structure of structures) {
    const x = Math.floor(structure.x / cellSize);
    const y = Math.floor(structure.y / cellSize);
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const key = y * width + x;
    const grouped = structuresByCell.get(key);
    if (grouped) grouped.push(structure);
    else structuresByCell.set(key, [structure]);
  }
  return {
    worldWidth,
    worldHeight,
    width,
    height,
    cellSize,
    terrainValues,
    settledElementValues,
    elementValues,
    particleValues,
    fog,
    walls,
    authorization,
    wallPalette: Array.isArray(wallPalette) ? wallPalette : [],
    structures,
    inspectionValues,
    structuresByCell,
  };
}

/** Compose a raster from prepared layers without traversing the world matrix. */
export function composeSaveExplorerMinimap(
  prepared: PreparedSaveExplorerRenderState,
  options: MinimapRenderOptions = {},
): MinimapRaster {
  const { width, height, terrainValues, settledElementValues, elementValues, particleValues } =
    prepared;
  const { fog, walls, authorization } = prepared;
  const palette = options.palette ? { ...DEFAULT_PALETTE, ...options.palette } : DEFAULT_PALETTE;
  const wallFallback = options.wallColor || [166, 166, 166, 255];
  const authorizationColor = options.authorizationColor || [255, 64, 192, 160];
  const pixels = new Uint8ClampedArray(width * height * 4);
  const structureColor = options.structureColor || [208, 152, 30, 255];
  const structurePalette = options.structurePalette || DEFAULT_STRUCTURE_PALETTE;
  const renderLayers: Partial<Record<SaveExplorerRenderLayer, () => void>> = {
    background: () => {
      for (let index = 0; index < terrainValues.length; index++)
        copyColor(pixels, index * 4, SKY_COLOR);
    },
    matrix: () => {
      const terrain = options.drawTerrain !== false;
      const settledElement = options.drawSettledElements !== false;
      const element = options.drawElements !== false;
      const particle = options.drawParticles !== false;
      const terrainFog = options.drawTerrainFog !== false;
      for (let index = 0; index < terrainValues.length; index++) {
        if (terrain && terrainValues[index] !== 0) {
          const tVal = terrainValues[index];
          if (!terrainFog && (tVal === 4 || tVal === 5)) {
            // Skip ambient terrain fog so open cave background remains visible
          } else {
            copyColor(pixels, index * 4, colorForValue(tVal, palette));
          }
        }
        if (settledElement && settledElementValues[index] !== 0)
          copyColor(
            pixels,
            index * 4,
            colorForValue(settledElementValues[index], palette, [210, 210, 210, 255]),
          );
        if (element && elementValues[index] !== 0)
          copyColor(
            pixels,
            index * 4,
            colorForValue(elementValues[index], palette, [180, 220, 255, 255]),
          );
        if (particle && particleValues[index] !== 0)
          copyColor(
            pixels,
            index * 4,
            colorForValue(particleValues[index], palette, [255, 96, 192, 255]),
          );
      }
    },
    wall: () => {
      if (options.drawWalls === false) return;
      for (let index = 0; index < walls.length; index++) {
        if (walls[index] !== 0)
          copyColor(
            pixels,
            index * 4,
            wallPaletteColor(prepared.wallPalette, walls[index], wallFallback),
          );
      }
    },
    structures: () => {
      if (options.drawStructures === false) return;
      for (const structure of prepared.structures) {
        const x = Math.floor(structure.x / prepared.cellSize);
        const y = Math.floor(structure.y / prepared.cellSize);
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        copyColor(
          pixels,
          (y * width + x) * 4,
          parseStructureColor(structure.color) ||
            structureColorFor(structure.type, structureColor, structurePalette),
        );
      }
    },
    authorization: () => {
      if (options.drawAuthorization !== true) return;
      for (let index = 0; index < authorization.length; index++) {
        if (authorization[index] !== 0) copyColor(pixels, index * 4, authorizationColor);
      }
    },
    fog: () => {
      if (options.drawFog === false) return;
      for (let index = 0; index < fog.length; index++) {
        if (fog[index] !== 255) copyColor(pixels, index * 4, FOG_COLOR);
      }
    },
  };
  for (const layer of SAVE_EXPLORER_LAYER_ORDER) renderLayers[layer]?.();
  return { width, height, pixels };
}

/** Build the native-style one-pixel-per-cell minimap raster. */
export function renderMinimapRgba(
  document: SaveGameDocument,
  options: MinimapRenderOptions = {},
): MinimapRaster {
  return composeSaveExplorerMinimap(prepareSaveExplorerRenderState(document, options), options);
}
