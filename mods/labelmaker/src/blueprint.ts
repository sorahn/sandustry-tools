import { LABELMAKER_CELL_GAP, glyphFor } from "./font";

export type LabelBlueprintStructure = {
  type: string;
  x: number;
  y: number;
  data: {
    __prefabulatorBlueprint: {
      definition: {
        shape: number[][];
        cellIds: number[][];
      };
    };
  };
};

export type LabelBlueprint = {
  name: string;
  data: LabelBlueprintStructure[];
  signalLinks: null;
};

const PREFAB_TERRAIN_TYPE = "prefabTerrain_5";
const PREFAB_CELL_ID = 31;
const PREFAB_BLOCK_CELLS = 4;

export function labelBitmap(text: string): number[][] {
  const glyphs = [...text].map(glyphFor);
  const width =
    glyphs.reduce((total, glyph) => total + Math.max(0, ...glyph.map((row) => row.length)), 0) +
    Math.max(0, glyphs.length - 1) * LABELMAKER_CELL_GAP;
  const height = Math.max(0, ...glyphs.map((glyph) => glyph.length));
  const bitmap = Array.from({ length: height }, () => Array<number>(width).fill(0));

  let left = 0;
  for (const glyph of glyphs) {
    for (let y = 0; y < glyph.length; y += 1)
      for (let x = 0; x < glyph[y].length; x += 1)
        bitmap[y][left + x] = glyph[y][x] === "1" ? 1 : 0;
    left += Math.max(0, ...glyph.map((row) => row.length)) + LABELMAKER_CELL_GAP;
  }
  return bitmap;
}

export function createLabelBlueprint(text: string): LabelBlueprint {
  const bitmap = labelBitmap(text);
  const width = bitmap[0]?.length ?? 0;
  const data: LabelBlueprintStructure[] = [];
  for (let blockY = 0; blockY < bitmap.length; blockY += PREFAB_BLOCK_CELLS)
    for (let blockX = 0; blockX < width; blockX += PREFAB_BLOCK_CELLS) {
      const shape: number[][] = [];
      const cellIds: number[][] = [];
      for (let y = 0; y < PREFAB_BLOCK_CELLS; y += 1) {
        const shapeRow: number[] = [];
        const cellIdRow: number[] = [];
        for (let x = 0; x < PREFAB_BLOCK_CELLS; x += 1) {
          const filled = bitmap[blockY + y]?.[blockX + x] === 1;
          shapeRow.push(filled ? 1 : 0);
          cellIdRow.push(filled ? PREFAB_CELL_ID : 0);
        }
        shape.push(shapeRow);
        cellIds.push(cellIdRow);
      }
      data.push({
        type: PREFAB_TERRAIN_TYPE,
        x: blockX,
        y: blockY,
        data: { __prefabulatorBlueprint: { definition: { shape, cellIds } } },
      });
    }
  return { name: `Labelmaker: ${text}`, data, signalLinks: null };
}
