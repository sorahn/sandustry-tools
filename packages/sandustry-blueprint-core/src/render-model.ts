import type { Blueprint, BlueprintType } from "./index.js";
import {
  prepareBlueprint,
  type BlueprintCatalog,
  type PreparedBlueprint,
  type PreparedStructure,
  type RenderAsset,
} from "./prepare.js";

export const DEFAULT_RENDER_PADDING = 6;
export const DEFAULT_RENDER_CELL = 8;
export const NATIVE_PIXELS_PER_CELL = 4;

export type BlueprintRenderOptions = {
  catalog?: BlueprintCatalog;
  padding?: number;
  /** Minimum output width in display pixels, centered around the blueprint. */
  minWidth?: number;
  cell?: number;
  unknownFootprint?: { width: number; height: number };
  preparedBlueprint?: PreparedBlueprint;
};

export type BlueprintRenderStructure = {
  structure: Blueprint["data"][number];
  index: number;
  z: number;
};

export type BlueprintRenderModel = {
  blueprint: Blueprint;
  preparedBlueprint: PreparedBlueprint;
  padding: number;
  paddingX: number;
  cell: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  blueprintWidth: number;
  blueprintHeight: number;
  renderStructures: BlueprintRenderStructure[];
};

export function structureLabel(type: BlueprintType) {
  return typeof type === "number" ? `native ${type}` : type;
}

export function tileColor(type: BlueprintType) {
  if (typeof type === "number") return "#314158";
  let hash = 0;
  for (const character of type) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return ["#4b3c62", "#315a5e", "#66522f", "#563d46"][Math.abs(hash) % 4];
}

export function wrapLabel(label: string, maxCharacters: number) {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (word.length > maxCharacters && !line) {
      for (let index = 0; index < word.length; index += maxCharacters) {
        lines.push(word.slice(index, index + maxCharacters));
      }
      continue;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [label];
}

function renderAssetOffsetX(prepared: PreparedStructure) {
  return (prepared.sprite?.asset.offset?.x ?? 0) / NATIVE_PIXELS_PER_CELL;
}

export function renderPixelScale(cell: number) {
  return cell / NATIVE_PIXELS_PER_CELL;
}

export function renderScaleMode(scale: RenderAsset["scale"]) {
  return typeof scale === "object" && scale !== null ? scale.mode : scale;
}

export function renderScaleFactor(scale: RenderAsset["scale"]) {
  return typeof scale === "object" && scale !== null ? (scale.factor ?? 1) : 1;
}

export function renderAnchorEdge(anchor: RenderAsset["anchor"]) {
  return typeof anchor === "object" && anchor !== null ? anchor.edge : anchor;
}

export function renderAnchorOffsetCells(anchor: RenderAsset["anchor"]) {
  return typeof anchor === "object" && anchor !== null ? (anchor.offsetCells ?? 0) : 0;
}

export function createBlueprintRenderModel(
  blueprint: Blueprint,
  options: BlueprintRenderOptions = {},
): BlueprintRenderModel {
  const padding = options.padding ?? DEFAULT_RENDER_PADDING;
  const cell = options.cell ?? DEFAULT_RENDER_CELL;
  const preparedBlueprint = options.preparedBlueprint ?? prepareBlueprint(blueprint, options);
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  if (blueprint.data.length) {
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    for (let index = 0; index < blueprint.data.length; index++) {
      const structure = blueprint.data[index];
      const prepared = preparedBlueprint.preparedStructures[index];
      const assetOffsetX = renderAssetOffsetX(prepared);
      const x1 = structure.x + assetOffsetX;
      const x2 = structure.x + prepared.footprint.width - 1 + assetOffsetX;
      if (x1 < minX) minX = x1;
      if (x2 > maxX) maxX = x2;
      const y1 = prepared.visualTopY;
      const y2 = prepared.topY + prepared.footprint.height - 1;
      if (y1 < minY) minY = y1;
      if (y2 > maxY) maxY = y2;
    }
  }
  const naturalWidth = (maxX - minX + padding * 2 + 1) * cell;
  const width = Math.max(naturalWidth, options.minWidth ?? 0);
  const paddingX = padding + (width - naturalWidth) / (2 * cell);
  const height = (maxY - minY + padding * 2 + 1) * cell;
  const blueprintWidth = (maxX - minX + 1) * cell;
  const blueprintHeight = (maxY - minY + 1) * cell;
  const renderStructures = blueprint.data
    .map((structure, index) => ({
      structure,
      index,
      z: preparedBlueprint.preparedStructures[index].z,
    }))
    .sort(
      (left, right) =>
        left.z - right.z ||
        left.structure.y - right.structure.y ||
        left.structure.x - right.structure.x ||
        left.index - right.index,
    );
  return {
    blueprint,
    preparedBlueprint,
    padding,
    paddingX,
    cell,
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    blueprintWidth,
    blueprintHeight,
    renderStructures,
  };
}
