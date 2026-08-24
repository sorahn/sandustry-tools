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
};

type Point = { x: number; y: number };
type Segment = { from: Point; to: Point };

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

function extractGlyph(font: Font, character: string, options: TtfFontOptions): LabelGlyph {
  const glyph = font.charToGlyph(character);
  const segments = pathSegments(glyph, options.fontSize);
  if (!segments.length) {
    return {
      width: 0,
      height: 0,
      rows: [],
      advance: Math.max(0, Math.round((glyph.advanceWidth / font.unitsPerEm) * options.fontSize)),
    };
  }

  const points = segments.flatMap(({ from, to }) => [from, to]);
  const minX = Math.floor(Math.min(...points.map(({ x }) => x)));
  const maxX = Math.ceil(Math.max(...points.map(({ x }) => x)));
  const minY = Math.floor(Math.min(...points.map(({ y }) => y)));
  const maxY = Math.ceil(Math.max(...points.map(({ y }) => y)));
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const rows = Array.from({ length: height }, (_, row) => {
    let packed = 0;
    const y = maxY - row - 0.5;
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
    advance: Math.max(0, Math.round((glyph.advanceWidth / font.unitsPerEm) * options.fontSize)),
  };
}

export function extractPureTtfFont(buffer: ArrayBuffer, options: TtfFontOptions): LabelFontData {
  if (!Number.isInteger(options.fontSize) || options.fontSize < 1)
    throw new Error("TTF font size must be a positive integer.");
  const font = opentype.parse(buffer);
  const glyphs: Record<string, LabelGlyph> = {};
  for (let code = FIRST_ASCII; code <= LAST_ASCII; code++) {
    const character = String.fromCodePoint(code);
    glyphs[character] = extractGlyph(font, character, options);
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
