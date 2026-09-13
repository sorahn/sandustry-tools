import { PNG } from "pngjs";
import {
  renderMinimapRgba,
  type MinimapRaster,
  type MinimapRenderOptions,
  type SaveGameDocument,
} from "../../packages/sandustry-save-core/src/index.ts";

/**
 * Converts a MinimapRaster RGBA buffer into a PNG buffer using pngjs.
 */
export function rasterToPngBuffer(raster: MinimapRaster): Buffer {
  const png = new PNG({ width: raster.width, height: raster.height });
  png.data = Buffer.from(raster.pixels.buffer, raster.pixels.byteOffset, raster.pixels.byteLength);
  return PNG.sync.write(png);
}

/**
 * Renders a SaveGameDocument (including synthetic procgen saves) directly to a PNG buffer.
 * Disables fog by default for pure terrain visibility.
 */
export function renderTerrainMinimapPng(
  document: SaveGameDocument,
  options: MinimapRenderOptions = {},
): { png: Buffer; width: number; height: number } {
  const renderOptions: MinimapRenderOptions = {
    drawFog: false,
    drawWalls: false,
    drawAuthorization: false,
    ...options,
  };
  const raster = renderMinimapRgba(document, renderOptions);
  const png = rasterToPngBuffer(raster);
  return { png, width: raster.width, height: raster.height };
}
