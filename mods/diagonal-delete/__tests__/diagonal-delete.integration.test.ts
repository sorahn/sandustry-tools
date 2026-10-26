import assert from "node:assert/strict";
import { test } from "node:test";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

const game = await setupGame();
const itemId = "diagonalDelete";
const modId = "sorahn.sandustry-diagonal-delete";
type Point = { x: number; y: number };

async function fixtures(points: Point[]): Promise<void> {
  await game.resumeSimulation();
  await game.evaluate((cells) => {
    for (const cell of cells) {
      sandkit.api.structures.buildAtCell(cell.x, cell.y, "foundation", {
        bypassPlacementChecks: true,
      });
    }
    sandkit.api.ui.hotbar.selectAction({ id: "diagonalDelete", type: 2 });
  }, points);
  await game.waitFor(
    (cells) => cells.every((cell) => Boolean(sandkit.api.structures.getAtCell(cell.x, cell.y))),
    (built) => built,
    { args: [points], message: "Diagonal Delete fixture was not built" },
  );
  await game.waitFor(
    () => sandkit.api.action?.getSelected()?.id,
    (selected) => selected === itemId,
    { message: "Diagonal Delete was not selected" },
  );
}

async function drag(start: Point, end: Point, parallelogramEnd?: Point): Promise<void> {
  await game.evaluate(
    ({ start, end, parallelogramEnd }) => {
      const state = sandkit.engine.state;
      const definition = sandkit.api.items.getDefinitionById("diagonalDelete");
      if (!definition?.handleAction) throw new Error("Diagonal Delete action is unavailable");
      const mouse = (state.session.input as any).mouse;
      const oldMouse = mouse.cellPosition;
      const oldAction = state.session.action.state;
      const action = (phase: number, point: Point) => {
        mouse.cellPosition = point;
        state.session.action.state = { [phase]: true };
        definition.handleAction?.(state);
      };
      try {
        action(1, start);
        action(2, end);
        definition.afterRender?.(state);
        if (parallelogramEnd) {
          // This synthetic drag completes in one renderer turn. Invoke the
          // registered key handler in that same input frame; triggerBinding
          // queues it for the next frame, after this drag would have ended.
          const binding = (state as any).sandkit.keyBindings[
            "sorahn.sandustry-diagonal-delete:parallelogram"
          ];
          binding.handlers.down(state);
          if ((state.session.action.customData as any)?.shapeMode !== "parallelogram") {
            throw new Error("Parallelogram binding did not lock the active drag");
          }
          action(2, parallelogramEnd);
          definition.afterRender?.(state);
        }
        action(3, parallelogramEnd ?? end);
      } finally {
        mouse.cellPosition = oldMouse;
        state.session.action.state = oldAction;
      }
    },
    { start, end, parallelogramEnd },
  );
}

async function assertPresence(points: Point[], expected: boolean[]): Promise<void> {
  const actual = await game.waitFor(
    (cells) => cells.map((cell) => Boolean(sandkit.api.structures.getAtCell(cell.x, cell.y))),
    (present) => JSON.stringify(present) === JSON.stringify(expected),
    { args: [points], message: `Expected structure presence ${JSON.stringify(expected)}` },
  );
  assert.deepEqual(actual, expected);
}

test("Diagonal Delete registers once and is granted on game ready", async () => {
  const result = await game.waitFor(
    () => {
      const definition = sandkit.api.items.getDefinitionById("diagonalDelete");
      const inventory = sandkit.engine.state.store.player.inventory as Array<{ id?: string }>;
      return {
        action: typeof definition?.handleAction,
        preview: typeof definition?.afterRender,
        copies: inventory.filter((item) => item.id === "diagonalDelete").length,
      };
    },
    (state) => state.action === "function" && state.copies === 1,
    { message: "Diagonal Delete did not register and grant exactly one tool" },
  );
  assert.deepEqual(result, { action: "function", preview: "function", copies: 1 });
});

test("a diagonal drag removes its line and one native undo restores the group", async () => {
  const cells = [
    { x: 600, y: 600 },
    { x: 604, y: 604 },
    { x: 608, y: 608 },
    { x: 608, y: 600 },
  ];
  await fixtures(cells);
  await drag(cells[0], cells[2]);
  await assertPresence(cells, [false, false, false, true]);
  await game.evaluate(() => sandkit.api.input.triggerBinding("Undo"));
  await assertPresence(cells, [true, true, true, true]);
});

test("free mode and parallelogram mode preserve structures outside the selection", async () => {
  const cells = [
    { x: 640, y: 600 },
    { x: 644, y: 600 },
    { x: 648, y: 600 },
    { x: 640, y: 604 },
    { x: 644, y: 604 },
    { x: 648, y: 604 },
    { x: 652, y: 604 },
  ];
  await fixtures(cells);
  await game.evaluate(() => {
    if (sandkit.api.storage.local.get("sorahn.sandustry-diagonal-delete.mode") !== "free") {
      sandkit.api.input.triggerBinding("sorahn.sandustry-diagonal-delete:mode");
    }
  });
  await game.waitFor(
    () => sandkit.api.storage.local.get("sorahn.sandustry-diagonal-delete.mode"),
    (mode) => mode === "free",
    { message: "Free-mode binding was not processed" },
  );
  await drag(cells[0], cells[2], cells[5]);
  await assertPresence(cells, [false, false, false, false, false, false, true]);
  await game.evaluate(() => sandkit.api.input.triggerBinding("Undo"));
  await assertPresence(
    cells,
    cells.map(() => true),
  );
});

test("0.6 removal protection receives the mod identity and can veto one selected structure", async () => {
  const cells = [
    { x: 680, y: 600 },
    { x: 684, y: 600 },
    { x: 688, y: 600 },
  ];
  await fixtures(cells);
  await game.evaluate((protectedCell) => {
    (globalThis as any).__diagonalDeleteRequesters = [];
    (globalThis as any).__diagonalDeleteProtection = sandkit.api.hooks.intercept?.(
      "building:remove",
      (payload: any, control: any) => {
        (globalThis as any).__diagonalDeleteRequesters.push(payload.requesterModId);
        if (payload.structure.x === protectedCell.x && payload.structure.y === protectedCell.y) {
          control.cancel();
        }
      },
    );
  }, cells[1]);
  try {
    await drag(cells[0], cells[2]);
    await assertPresence(cells, [false, true, false]);
    const requesters = await game.evaluate(
      () => (globalThis as any).__diagonalDeleteRequesters as string[],
    );
    assert.ok(requesters.length >= 3);
    assert.ok(requesters.every((requester) => requester === modId));
  } finally {
    await game.evaluate(() => (globalThis as any).__diagonalDeleteProtection?.());
  }
  await game.evaluate(() => sandkit.api.input.triggerBinding("Undo"));
  await assertPresence(
    cells,
    cells.map(() => true),
  );
});
