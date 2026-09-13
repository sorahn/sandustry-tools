import { PNG } from "pngjs";
import {
  renderMinimapRgba,
  type HellevatorShaft,
  type MinimapRaster,
  type MinimapRenderOptions,
  type SaveGameDocument,
} from "../../packages/sandustry-save-core/src/index.ts";

export const HELLEVATOR_HIGHLIGHT_PALETTE: readonly [number, number, number][] = [
  [0, 240, 255], // #1: Bright Cyan
  [255, 215, 0], // #2: Gold
  [255, 60, 160], // #3: Magenta
  [50, 255, 100], // #4: Bright Green
  [255, 140, 0], // #5: Neon Orange
  [180, 100, 255], // #6: Purple
  [255, 255, 80], // #7: Lemon Yellow
  [0, 200, 180], // #8: Teal
  [255, 80, 80], // #9: Coral Red
  [120, 220, 255], // #10: Ice Blue
];

/**
 * Overlays visual highlights for discovered hellevator shafts onto a minimap raster.
 */
export function applyHellevatorHighlights(
  raster: MinimapRaster,
  shafts: HellevatorShaft[],
  maxHighlights = 5,
): void {
  const { width, height, pixels } = raster;
  const count = Math.min(shafts.length, maxHighlights);

  const blend = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    const alpha = a / 255;
    const invAlpha = 1 - alpha;
    pixels[idx] = Math.round(r * alpha + pixels[idx] * invAlpha);
    pixels[idx + 1] = Math.round(g * alpha + pixels[idx + 1] * invAlpha);
    pixels[idx + 2] = Math.round(b * alpha + pixels[idx + 2] * invAlpha);
    pixels[idx + 3] = 255;
  };

  for (let i = 0; i < count; i++) {
    const shaft = shafts[i];
    const [r, g, b] = HELLEVATOR_HIGHLIGHT_PALETTE[i % HELLEVATOR_HIGHLIGHT_PALETTE.length];

    const tileX1 = Math.floor(shaft.startX / 4);
    const tileX2 = Math.floor(shaft.endX / 4);
    const tileY1 = Math.floor(shaft.startY / 4);
    const tileY2 = Math.min(height - 1, Math.floor(shaft.endY / 4));

    // Ensure at least 2 minimap pixels wide for high visibility on 960x960 map
    const drawX1 = tileX1;
    const drawX2 = Math.max(tileX2, tileX1 + 1);

    for (let y = tileY1; y <= tileY2; y++) {
      for (let x = drawX1; x <= drawX2; x++) {
        const isBorder = x === drawX1 || x === drawX2 || y === tileY1 || y === tileY2;
        blend(x, y, r, g, b, isBorder ? 235 : 110);
      }
    }

    // Top and bottom crossbar endcaps
    for (let dx = -2; dx <= 2; dx++) {
      blend(drawX1 + dx, tileY1, 255, 255, 255, 255);
      blend(drawX1 + dx, tileY2, 255, 255, 255, 255);
    }
  }
}

/**
 * Converts a MinimapRaster RGBA buffer into a PNG buffer using pngjs.
 */
export function rasterToPngBuffer(raster: MinimapRaster): Buffer {
  const png = new PNG({ width: raster.width, height: raster.height });
  png.data = Buffer.from(raster.pixels.buffer, raster.pixels.byteOffset, raster.pixels.byteLength);
  return PNG.sync.write(png);
}

export interface TerrainMinimapOptions extends MinimapRenderOptions {
  /** Optional hellevator shafts to highlight on the generated minimap. */
  highlightShafts?: HellevatorShaft[];
  /** Maximum number of highlighted shafts to draw (default: 5). */
  maxHighlights?: number;
}

/**
 * Default procgen palette overrides.
 * Uses Option B (Deep Scrim Blue: [30, 80, 102, 255]) for cavern fog to cleanly distinguish
 * open subterranean chambers from pitch-black bedrock without looking like bright daylight sky.
 */
export const DEFAULT_PROCGEN_PALETTE: Readonly<
  Record<number, readonly [number, number, number, number]>
> = {
  4: [30, 80, 102, 255], // Fog (Deep Scrim Blue)
  5: [30, 80, 102, 255], // Jetpack Fog
};

/**
 * Backup / alternative palette: Option D (Cool Mist Grey: [70, 82, 92, 255]).
 */
export const COOL_MIST_FOG_PALETTE: Readonly<
  Record<number, readonly [number, number, number, number]>
> = {
  4: [70, 82, 92, 255],
  5: [70, 82, 92, 255],
};

/**
 * Renders a SaveGameDocument (including synthetic procgen saves) directly to a PNG buffer.
 * Renders cavern fog with Deep Scrim Blue by default for clear separation from bedrock and sky.
 */
export function renderTerrainMinimapPng(
  document: SaveGameDocument,
  options: TerrainMinimapOptions = {},
): { png: Buffer; width: number; height: number } {
  const { highlightShafts, maxHighlights, palette, ...renderOptions } = options;
  const mergedPalette = {
    ...DEFAULT_PROCGEN_PALETTE,
    ...palette,
  };
  const raster = renderMinimapRgba(document, {
    drawFog: false,
    drawTerrainFog: true,
    drawWalls: false,
    drawAuthorization: false,
    palette: mergedPalette,
    ...renderOptions,
  });

  if (highlightShafts && highlightShafts.length > 0) {
    applyHellevatorHighlights(raster, highlightShafts, maxHighlights);
  }

  const png = rasterToPngBuffer(raster);
  return { png, width: raster.width, height: raster.height };
}
