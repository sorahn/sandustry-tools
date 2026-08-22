import {
  LABELMAKER_CELL_GAP,
  LABELMAKER_GLYPH_HEIGHT,
  LABELMAKER_GLYPH_WIDTH,
  glyphFor,
} from "./labelmaker-font";

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
  const width = Math.max(0, text.length * (LABELMAKER_GLYPH_WIDTH + LABELMAKER_CELL_GAP) - 1);
  const bitmap = Array.from({ length: LABELMAKER_GLYPH_HEIGHT }, () =>
    Array<number>(width).fill(0),
  );

  for (let characterIndex = 0; characterIndex < text.length; characterIndex += 1) {
    const glyph = glyphFor(text[characterIndex]);
    const left = characterIndex * (LABELMAKER_GLYPH_WIDTH + LABELMAKER_CELL_GAP);
    for (let y = 0; y < LABELMAKER_GLYPH_HEIGHT; y += 1)
      for (let x = 0; x < LABELMAKER_GLYPH_WIDTH; x += 1)
        bitmap[y][left + x] = glyph[y][x] === "1" ? 1 : 0;
  }
  return bitmap;
}

export function createLabelBlueprint(text: string): LabelBlueprint {
  const bitmap = labelBitmap(text);
  const width = bitmap[0]?.length ?? 0;
  const data: LabelBlueprintStructure[] = [];
  for (let blockY = 0; blockY < LABELMAKER_GLYPH_HEIGHT; blockY += PREFAB_BLOCK_CELLS)
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
