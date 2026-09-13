import { expect, test } from "bun:test";
import {
  decodeBrowserSave,
  INDESTRUCTIBLE_TERRAIN_IDS,
  isIndestructibleTerrain,
  isPassableMatrixValue,
  scanHellevatorShafts,
  type SaveGameDocument,
} from "../src/index";

const fixture = (name: string) => Bun.file(new URL(`./visual/saves/${name}`, import.meta.url));

test("catalog correctly classifies indestructible terrains", () => {
  // Indestructible
  expect(isIndestructibleTerrain(39)).toBe(true); // Sandstone
  expect(isIndestructibleTerrain(41)).toBe(true); // Limestone
  expect(isIndestructibleTerrain(42)).toBe(true); // Bedrock
  expect(isIndestructibleTerrain(49)).toBe(true); // Blackrock
  expect(isIndestructibleTerrain(55)).toBe(true); // Deepstone

  // Destructible
  expect(isIndestructibleTerrain(2)).toBe(false); // Dirt
  expect(isIndestructibleTerrain(23)).toBe(false); // Stone
  expect(isIndestructibleTerrain(44)).toBe(false); // Copper Ore
  expect(isIndestructibleTerrain(0)).toBe(false); // Empty Air

  // Passable matrix value
  expect(isPassableMatrixValue(0)).toBe(true); // Air
  expect(isPassableMatrixValue(2)).toBe(true); // Dirt
  expect(isPassableMatrixValue(42)).toBe(false); // Bedrock
  expect(isPassableMatrixValue(55)).toBe(false); // Deepstone
  expect(isPassableMatrixValue(101)).toBe(true); // Settled element
  expect(isPassableMatrixValue({ type: 3, particle: true })).toBe(true); // Particle
  expect(isPassableMatrixValue(-420010)).toBe(false); // Damaged bedrock
  expect(isPassableMatrixValue(-20010)).toBe(true); // Damaged dirt
});

test("scans vertical shafts in synthetic small matrix", () => {
  // Grid: 8 columns x 10 rows
  // Row 0-2: Air (0)
  // Row 3-8: Column 0-3 has Dirt (2), Column 4-7 has Dirt (2)
  // At (x=2, y=6), place Bedrock (42) -> blocks columns 0-3 from passing through row 6
  // Column 4-7 is completely clear all the way to Row 9
  const width = 8;
  const height = 10;
  const grid = new Int32Array(width * height);

  // Fill Row 3-9 with Dirt (2)
  for (let y = 3; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y * width + x] = 2;
    }
  }
  // Place Bedrock at (x=2, y=6)
  grid[6 * width + 2] = 42;

  // Encode to RLE
  const matrix: number[] = [];
  let cur = grid[0];
  let count = 1;
  for (let i = 1; i < grid.length; i++) {
    if (grid[i] === cur) {
      count++;
    } else {
      matrix.push(cur, count);
      cur = grid[i];
      count = 1;
    }
  }
  matrix.push(cur, count);

  const result = scanHellevatorShafts(
    { matrix, width, height },
    { minWidth: 4, minLength: 5, clusterDistance: 2 },
  );

  expect(result.shafts.length).toBeGreaterThanOrEqual(1);

  // The best shaft should be columns 3-7 (expanded maximal width, clear from y=0 to y=9, length 10)
  const best = result.shafts[0];
  expect(best.startX).toBe(3);
  expect(best.endX).toBe(7);
  expect(best.width).toBe(5);
  expect(best.startY).toBe(0);
  expect(best.endY).toBe(9);
  expect(best.length).toBe(10);
  expect(best.reachesSurface).toBe(true);
});

test("breaks ties for tallest shaft by ordering by width descending", () => {
  // Grid: 24 columns x 10 rows
  // Shaft A: columns 0..3 (width 4), length 10
  // Shaft B: columns 8..15 (width 8), length 10
  // Intervening columns (4..7, 16..23) blocked by Bedrock (42) at y=5
  const width = 24;
  const height = 10;
  const grid = new Int32Array(width * height);

  // Fill Row 3-9 with Dirt (2)
  for (let y = 3; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y * width + x] = 2;
    }
  }

  // Block columns 4..7 and 16..23 at y=5 with Bedrock
  for (let x = 4; x <= 7; x++) grid[5 * width + x] = 42;
  for (let x = 16; x < 24; x++) grid[5 * width + x] = 42;

  // Encode to RLE
  const matrix: number[] = [];
  let cur = grid[0];
  let count = 1;
  for (let i = 1; i < grid.length; i++) {
    if (grid[i] === cur) {
      count++;
    } else {
      matrix.push(cur, count);
      cur = grid[i];
      count = 1;
    }
  }
  matrix.push(cur, count);

  const result = scanHellevatorShafts(
    { matrix, width, height },
    { minWidth: 4, minLength: 5, clusterDistance: 2 },
  );

  expect(result.shafts.length).toBeGreaterThanOrEqual(2);

  // Rank 1 must be the wider shaft (columns 8..15, width 8)
  expect(result.shafts[0].rank).toBe(1);
  expect(result.shafts[0].startX).toBe(8);
  expect(result.shafts[0].endX).toBe(15);
  expect(result.shafts[0].width).toBe(8);
  expect(result.shafts[0].length).toBe(10);

  // Rank 2 must be the narrower shaft (columns 0..3, width 4)
  expect(result.shafts[1].rank).toBe(2);
  expect(result.shafts[1].startX).toBe(0);
  expect(result.shafts[1].endX).toBe(3);
  expect(result.shafts[1].width).toBe(4);
  expect(result.shafts[1].length).toBe(10);
});

test("scans hellevator shafts in real world save (new-world.save)", async () => {
  const save = await decodeBrowserSave(await fixture("new-world.save").bytes());
  const result = scanHellevatorShafts(save, {
    minWidth: 4,
    minLength: 500,
    topK: 5,
    clusterDistance: 32,
  });

  expect(result.shafts.length).toBe(5);

  for (const shaft of result.shafts) {
    expect(shaft.width).toBeGreaterThanOrEqual(4);
    expect(shaft.length).toBeGreaterThanOrEqual(500);
    expect(shaft.tileWidth).toBe(shaft.width / 4);
    expect(shaft.tileLength).toBe(shaft.length / 4);
    expect(shaft.tileX).toBe(shaft.startX / 4);
    expect(shaft.tileStartY).toBe(shaft.startY / 4);
    expect(shaft.tileEndY).toBe(shaft.endY / 4);
  }

  // Verify rank 1 is a valid deep corridor
  const top1 = result.shafts[0];
  expect(top1.rank).toBe(1);
  expect(top1.undergroundDepth).toBeGreaterThan(1000);
});
