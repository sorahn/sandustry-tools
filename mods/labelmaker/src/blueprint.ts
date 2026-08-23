import type { LabelFont } from "./fonts/types";

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

export function labelBitmap(text: string, font: LabelFont): number[][] {
  const glyphs = [...text].map(font.glyphFor);
  const width = glyphs.reduce((total, glyph) => total + glyph.advance, 0);
  const height = Math.max(0, ...glyphs.map((glyph) => glyph.height));
  const bitmap = Array.from({ length: height }, () => Array<number>(width).fill(0));

  let left = 0;
  for (const glyph of glyphs) {
    for (let y = 0; y < glyph.height; y += 1)
      for (let x = 0; x < glyph.width; x += 1)
        bitmap[y][left + x] = glyph.rows[y] & (1 << (glyph.width - x - 1)) ? 1 : 0;
    left += glyph.advance;
  }
  return bitmap;
}

export function createLabelBlueprint(text: string, font: LabelFont): LabelBlueprint {
  const bitmap = labelBitmap(text, font);
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
        y: blockY + 1,
        data: { __prefabulatorBlueprint: { definition: { shape, cellIds } } },
      });
    }
  return { name: `Labelmaker: ${text}`, data, signalLinks: null };
}
