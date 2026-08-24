import opentype, { type Font, type Glyph, type PathCommand } from "opentype.js";
import type { LabelFontData } from "./font-data";
import type { LabelGlyph } from "./types";

const FIRST_ASCII = 32;
const LAST_ASCII = 127;

export type TtfAssetApi = {
  assets: {
    getUrl(relativePath: string): string;
  };
};

export type TtfFontOptions = {
  readonly name: string;
  readonly fontSize: number;
  readonly baselineRow?: number;
  readonly yOffset?: number;
  readonly fixedWidth?: boolean;
  /** Omit glyphs whose advance does not land on an integer Cell. */
  readonly strictAdvances?: boolean;
  /** Omit glyphs with curved, diagonal, or off-grid outline geometry. */
  readonly strictGeometry?: boolean;
  /** Font units between adjacent pixel-grid boundaries. */
  readonly gridUnits?: number;
  /** Small per-font tolerance for rounded outline coordinates. */
  readonly geometryTolerance?: number;
};

type Point = { x: number; y: number };
type Segment = { from: Point; to: Point };
type VerticalBounds = { minY: number; maxY: number };

function isLineCommand(command: PathCommand): command is Extract<PathCommand, { type: "M" | "L" }> {
  return command.type === "M" || command.type === "L";
}

function pathSegments(glyph: Glyph, fontSize: number): Segment[] {
  const commands = glyph.getPath(0, 0, fontSize).commands;
  const segments: Segment[] = [];
  let start: Point | undefined;
  let current: Point | undefined;

  for (const command of commands) {
    if (!isLineCommand(command) && command.type !== "Z") {
      throw new Error("Font contains curves; pure grid extraction rejected the glyph.");
    }
    if (command.type === "M") {
      current = { x: command.x, y: command.y };
      start = current;
    } else if (command.type === "L") {
      const next = { x: command.x, y: command.y };
      if (current) segments.push({ from: current, to: next });
      current = next;
    } else if (current && start) {
      segments.push({ from: current, to: start });
      current = undefined;
      start = undefined;
    }
  }
  return segments;
}

function containsEvenOdd(point: Point, segments: readonly Segment[]): boolean {
  let inside = false;
  for (const { from, to } of segments) {
    if (from.y > point.y === to.y > point.y) continue;
    const xAtY = ((to.x - from.x) * (point.y - from.y)) / (to.y - from.y) + from.x;
    if (point.x < xAtY) inside = !inside;
  }
  return inside;
}

function scaledAdvance(font: Font, glyph: Glyph, options: TtfFontOptions): number | null {
  const exact = (glyph.advanceWidth / font.unitsPerEm) * options.fontSize;
  if (options.strictAdvances && !Number.isInteger(exact)) return null;
  return Math.max(0, Math.ceil(exact));
}

function isGridCoordinate(value: number, gridStep: number, tolerance: number): boolean {
  const remainder = Math.abs(value / gridStep - Math.round(value / gridStep));
  return remainder < tolerance;
}

function extractGlyph(
  font: Font,
  character: string,
  options: TtfFontOptions,
  verticalBounds: VerticalBounds,
): LabelGlyph | null {
  const glyph = font.charToGlyph(character);
  const segments = pathSegments(glyph, options.fontSize);
  const advance = scaledAdvance(font, glyph, options);
  if (advance === null) return null;
  if (options.strictGeometry) {
    const gridStep = options.gridUnits
      ? (options.gridUnits / font.unitsPerEm) * options.fontSize
      : undefined;
    const geometryTolerance = options.geometryTolerance ?? 1e-6;
    const valid = segments.every(({ from, to }) => {
      const axisAligned = Math.abs(from.x - to.x) < 1e-6 || Math.abs(from.y - to.y) < 1e-6;
      const onGrid =
        gridStep === undefined ||
        (isGridCoordinate(from.x, gridStep, geometryTolerance) &&
          isGridCoordinate(from.y, gridStep, geometryTolerance) &&
          isGridCoordinate(to.x, gridStep, geometryTolerance) &&
          isGridCoordinate(to.y, gridStep, geometryTolerance));
      return axisAligned && onGrid;
    });
    if (!valid) return null;
  }
  if (!segments.length) {
    return {
      width: 0,
      height: verticalBounds.maxY - verticalBounds.minY,
      rows: Array(verticalBounds.maxY - verticalBounds.minY).fill(0),
      advance,
    };
  }

  const points = segments.flatMap(({ from, to }) => [from, to]);
  const minX = Math.floor(Math.min(...points.map(({ x }) => x)));
  const maxX = Math.ceil(Math.max(...points.map(({ x }) => x)));
  const width = Math.max(0, maxX - minX);
  const height = verticalBounds.maxY - verticalBounds.minY;
  const rows = Array.from({ length: height }, (_, row) => {
    let packed = 0;
    // opentype.js has already converted the font's upward-positive Y axis to
    // screen-style coordinates in getPath(), so scan from minY to maxY.
    const y = verticalBounds.minY + row + 0.5;
    for (let column = 0; column < width; column++) {
      if (containsEvenOdd({ x: minX + column + 0.5, y }, segments)) {
        packed |= 1 << (width - column - 1);
      }
    }
    return packed;
  });

  return {
    width,
    height,
    rows,
    advance,
  };
}

export function extractPureTtfFont(buffer: ArrayBuffer, options: TtfFontOptions): LabelFontData {
  if (!Number.isInteger(options.fontSize) || options.fontSize < 1)
    throw new Error("TTF font size must be a positive integer.");
  const font = opentype.parse(buffer);
  const characters = Array.from({ length: LAST_ASCII - FIRST_ASCII + 1 }, (_, index) =>
    String.fromCodePoint(FIRST_ASCII + index),
  );
  const verticalPoints = characters.flatMap((character) =>
    pathSegments(font.charToGlyph(character), options.fontSize).flatMap(({ from, to }) => [
      from,
      to,
    ]),
  );
  const verticalBounds: VerticalBounds = verticalPoints.length
    ? {
        minY: Math.floor(Math.min(...verticalPoints.map(({ y }) => y))),
        maxY: Math.ceil(Math.max(...verticalPoints.map(({ y }) => y))),
      }
    : { minY: 0, maxY: 0 };
  const glyphs: Record<string, LabelGlyph> = {};
  for (const character of characters) {
    const glyph = extractGlyph(font, character, options, verticalBounds);
    if (glyph) glyphs[character] = glyph;
  }
  const blankGlyph = glyphs[" "] ?? { width: 0, height: 0, rows: [], advance: options.fontSize };
  return {
    schemaVersion: 1,
    name: options.name,
    glyphs,
    blankGlyph,
    fontSize: options.fontSize,
    baselineRow: options.baselineRow,
    yOffset: options.yOffset,
    fixedWidth: options.fixedWidth,
  };
}

export async function loadPureTtfFont(
  api: TtfAssetApi,
  relativePath: string,
  options: TtfFontOptions,
): Promise<LabelFontData> {
  const response = await fetch(api.assets.getUrl(relativePath));
  if (!response.ok) throw new Error(`Could not load font asset (${response.status}).`);
  return extractPureTtfFont(await response.arrayBuffer(), options);
}
