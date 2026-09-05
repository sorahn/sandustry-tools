import assert from "node:assert/strict";
import test from "node:test";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

const game = await setupGame();

test("Splitter is loaded with a transparent 1x1 footprint", async () => {
  const details = await game.evaluate(() => {
    const api = sandkit.api as unknown as {
      structures: {
        getTypeById(id: string): string | number | null;
        isUnlockedByType(type: string | number): boolean;
        getDefinitionByType(type: string | number): {
          shape?: number[][];
        } | null;
      };
    };
    const type = api.structures.getTypeById("sandustrySplitter");
    const definition = type === null ? null : api.structures.getDefinitionByType(type);
    return {
      registered: type !== null,
      unlocked: type !== null && api.structures.isUnlockedByType(type),
      shape: definition?.shape ?? null,
    };
  });

  assert.equal(details.registered, true);
  assert.equal(details.unlocked, true);
  assert.deepEqual(details.shape, [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
});

test("Splitter routes seeded sand to both sides", async () => {
  const origin = { x: 3000, y: 1600 };
  const sand = await game.evaluate(() => sandkit.api.elements.getTypeById("sand"));
  assert.equal(typeof sand, "number");

  await game.buildLayout({
    origin,
    cells: [".x.", ".s.", "f.f"],
    legend: {
      f: { type: "foundation" },
      s: { type: "sandustrySplitter" },
    },
    seeds: [{ x: 1, y: 0, element: "sand", count: 2 }],
  });
  await game.runSimulation(400);

  const observed = await game.evaluate(
    (x, y, elementType) => {
      const countIn = (startX: number) => {
        let count = 0;
        for (let row = 4; row < 8; row += 1) {
          for (let column = 0; column < 4; column += 1) {
            if (sandkit.api.elements.getTypeAtCell(startX + column, y + row) === elementType)
              count += 1;
          }
        }
        return count;
      };
      return {
        left: countIn(x),
        right: countIn(x + 8),
      };
    },
    origin.x,
    origin.y,
    sand,
  );

  assert.ok(observed.left > 0, `No sand exited on the left: ${JSON.stringify(observed)}`);
  assert.ok(observed.right > 0, `No sand exited on the right: ${JSON.stringify(observed)}`);
});
