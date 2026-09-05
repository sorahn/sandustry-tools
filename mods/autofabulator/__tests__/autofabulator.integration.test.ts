import { test } from "node:test";
import assert from "node:assert/strict";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

const game = await setupGame();

type BrowserCdp = {
  sendQueued(method: string, params: Record<string, unknown>): Promise<unknown>;
};

const browserCdp = (game as unknown as { cdp: BrowserCdp }).cdp;

async function dispatchMouseClick(x: number, y: number): Promise<void> {
  await browserCdp.sendQueued("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
  });
  await browserCdp.sendQueued("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await browserCdp.sendQueued("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
}

async function dispatchMouseEvent(
  type: "mouseMoved" | "mousePressed" | "mouseReleased",
  x: number,
  y: number,
  button: "none" | "left" | "middle" | "right" = "none",
  buttons = 0,
): Promise<void> {
  await browserCdp.sendQueued("Input.dispatchMouseEvent", {
    type,
    x,
    y,
    button,
    buttons,
    clickCount: type === "mouseMoved" ? 0 : 1,
  });
}

async function dispatchKey(key: string): Promise<void> {
  await browserCdp.sendQueued("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
  });
  await browserCdp.sendQueued("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
  });
}

async function assertSimulationPaused(): Promise<void> {
  const paused = await game.evaluate(() =>
    Boolean((sandkit.engine.state as { session?: { paused?: boolean } }).session?.paused),
  );
  assert.equal(paused, true, "The simulation should be paused during Apply");
}

test("Autofabulator takes priority over a Signal Button click", async () => {
  await game.resumeSimulation();
  const fixture = await game.evaluate(() => {
    const x = 2400;
    const y = 1612;
    const buttonType = sandkit.api.structures.getTypeById("signalButton");
    if (buttonType === null || buttonType === undefined) {
      throw new Error("signalButton is not registered in the extracted game");
    }
    sandkit.api.player.buildings.unlockByType(buttonType);
    sandkit.api.structures.buildAtCell(x, y, "foundation");
    sandkit.api.structures.buildAtCell(x, y, buttonType);
    const interactableHandlers = (sandkit.engine.state.session as any).mods?.signals
      ?.interactableHandlers;
    const originalButtonHandler = interactableHandlers?.get?.(buttonType);
    if (interactableHandlers?.set) {
      interactableHandlers.set(buttonType, (...args: any[]) => {
        (globalThis as any).__autofabulatorButtonClicks =
          ((globalThis as any).__autofabulatorButtonClicks ?? 0) + 1;
        return originalButtonHandler?.(...args);
      });
    }
    sandkit.api.player.inventory.addFromId("sorahnAutofabulator");

    sandkit.api.player.setWorldPosition(x * 4 + 8, y * 4 + 8);
    return { x, y, buttonType };
  });

  await game.waitFor(
    (cellX, cellY) => sandkit.api.structures.getAtCell(cellX, cellY)?.type ?? null,
    (type) => type === fixture.buttonType,
    { args: [fixture.x, fixture.y], message: "Signal Button fixture was not built" },
  );

  const buttonClickPoint = await game.evaluate(({ x, y }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    const renderer = (sandkit.engine.state.session as any).rendering?.pixi?.app?.renderer;
    const camera = (sandkit.engine.state.session as any).camera;
    return {
      x: rect.left + ((x * 4 + 8 - camera.x) / renderer.width) * rect.width,
      y: rect.top + ((y * 4 - camera.y) / renderer.height) * rect.height,
    };
  }, fixture);

  const clickMenuEntry = async (label: string) => {
    const point = await game.evaluate((text) => {
      const itemImage =
        text === "Autofabulator"
          ? [...document.images].find((image) => image.src.includes("autofabulator.png"))
          : null;
      const match =
        itemImage ??
        [...document.querySelectorAll("*")].find((element) => element.textContent?.trim() === text);
      const clickable = match?.closest<HTMLElement>(".cursor-pointer");
      if (!clickable) throw new Error(`Could not find clickable menu entry: ${text}`);
      const rect = clickable.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, label);
    await dispatchMouseClick(point.x, point.y);
  };

  await clickMenuEntry("Toolbox");
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("Autofabulator")),
    (open) => open,
    { message: "Toolbox did not show Autofabulator" },
  );
  await clickMenuEntry("Autofabulator");
  await game.waitFor(
    () => sandkit.api.action?.getSelected?.()?.id ?? null,
    (id) => id === "sorahnAutofabulator",
    { message: "Autofabulator was not equipped from the Toolbox" },
  );

  await dispatchMouseClick(buttonClickPoint.x, buttonClickPoint.y);

  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator editor did not open after clicking Signal Button" },
  );

  const buttonClicks = await game.evaluate(
    () => (globalThis as any).__autofabulatorButtonClicks ?? 0,
  );
  if (buttonClicks !== 0) {
    throw new Error(`Signal Button handler received ${buttonClicks} click(s)`);
  }
});

test("Autofabulator preview includes solid foundations but not loose sand", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = { x: 2500, y: 1700 };
  await game.buildLayout({
    origin,
    cells: ["..", "ff"],
    legend: { f: { type: "foundation" } },
    seeds: [{ x: 1, y: 0, element: "sand", count: 2 }],
  });

  const clickPoint = await game.evaluate(({ x, y }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    const renderer = (sandkit.engine.state.session as any).rendering?.pixi?.app?.renderer;
    const camera = (sandkit.engine.state.session as any).camera;
    return {
      x: rect.left + ((x * 4 + 8 - camera.x) / renderer.width) * rect.width,
      y: rect.top + ((y * 4 - camera.y) / renderer.height) * rect.height,
    };
  }, origin);

  await dispatchMouseClick(clickPoint.x, clickPoint.y);
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator preview did not open for the empty block" },
  );

  const occupiedPerBlock = await game.evaluate(() =>
    [...document.querySelectorAll<HTMLButtonElement>('button[aria-label^="block "]')].map(
      (tile) =>
        [...tile.querySelectorAll<HTMLElement>("span")].filter(
          (cell) => getComputedStyle(cell).backgroundColor === "rgb(183, 190, 200)",
        ).length,
    ),
  );
  const expected = Array.from({ length: 25 }, () => 0);
  expected[17] = 16;
  expected[18] = 16;
  if (JSON.stringify(occupiedPerBlock) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected only the two foundation blocks in the preview, got ${JSON.stringify(occupiedPerBlock)}`,
    );
  }
});

test("Autofabulator paints only the clicked canvas cell", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const editorAnchor = { x: 2500, y: 1700 };
  const anchorPoint = await game.evaluate(({ x, y }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    const renderer = (sandkit.engine.state.session as any).rendering?.pixi?.app?.renderer;
    const camera = (sandkit.engine.state.session as any).camera;
    return {
      x: rect.left + ((x * 4 + 8 - camera.x) / renderer.width) * rect.width,
      y: rect.top + ((y * 4 - camera.y) / renderer.height) * rect.height,
    };
  }, editorAnchor);
  await dispatchMouseClick(anchorPoint.x, anchorPoint.y);
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator editor did not open for the cell-paint test" },
  );

  const clickPoint = await game.evaluate(() => {
    const tile = document.querySelector<HTMLButtonElement>('button[aria-label="block 1, 1"]');
    const cell = tile?.querySelectorAll<HTMLElement>("span")[5];
    if (!cell) throw new Error("Autofabulator canvas cell was not found");
    const rect = cell.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  await dispatchMouseClick(clickPoint.x, clickPoint.y);

  const canvasState = await game.evaluate(() => {
    const tiles = [...document.querySelectorAll<HTMLButtonElement>('button[aria-label^="block "]')];
    return {
      paintedCells: tiles.flatMap((tile) =>
        [...tile.querySelectorAll<HTMLElement>("span")].map(
          (cell) => getComputedStyle(cell).backgroundColor === "rgb(222, 166, 31)",
        ),
      ),
      blockBackgrounds: tiles.map((tile) => getComputedStyle(tile).backgroundColor),
    };
  });
  const { paintedCells } = canvasState;
  const expected = Array.from({ length: 25 * 17 }, () => false);
  expected[5] = true;
  if (JSON.stringify(paintedCells) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected only one painted canvas cell, got ${paintedCells.filter(Boolean).length} at ${paintedCells
        .map((painted, index) => (painted ? index : null))
        .filter((index) => index !== null)}`,
    );
  }
  if (canvasState.blockBackgrounds.some((background) => background === "rgb(222, 166, 31)")) {
    throw new Error("Painting one canvas cell colored its entire Blueprint Block");
  }
});

test("Autofabulator right-button drag erases until release", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const anchorPoint = await game.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await dispatchMouseClick(anchorPoint.x, anchorPoint.y);
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator editor did not open for the erase-drag test" },
  );

  const [first, second, third] = await game.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-autofab-cell]")].slice(0, 3).map((cell) => {
      const rect = cell.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }),
  );

  await dispatchMouseEvent("mouseMoved", first.x, first.y);
  await dispatchMouseEvent("mousePressed", first.x, first.y, "left", 1);
  await dispatchMouseEvent("mouseMoved", second.x, second.y, "left", 1);
  await dispatchMouseEvent("mouseMoved", third.x, third.y, "left", 1);
  await dispatchMouseEvent("mouseReleased", third.x, third.y, "left");

  await dispatchMouseEvent("mouseMoved", first.x, first.y);
  await dispatchMouseEvent("mousePressed", first.x, first.y, "right", 2);
  const erasedOnPress = await game.evaluate(
    () =>
      getComputedStyle(document.querySelector<HTMLElement>("[data-autofab-cell]")!).backgroundColor,
  );
  if (erasedOnPress === "rgb(222, 166, 31)") {
    throw new Error("Right mouse down did not erase the first cell immediately");
  }

  // The live macOS Electron window reports zero buttons during a physical
  // right-button drag even though the button remains held.
  await dispatchMouseEvent("mouseMoved", second.x, second.y, "right", 0);
  await dispatchMouseEvent("mouseReleased", second.x, second.y, "right");
  await dispatchMouseEvent("mouseMoved", third.x, third.y);

  const painted = await game.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-autofab-cell]")]
      .slice(0, 3)
      .map((cell) => getComputedStyle(cell).backgroundColor === "rgb(222, 166, 31)"),
  );
  if (JSON.stringify(painted) !== JSON.stringify([false, false, true])) {
    throw new Error(`Expected erase drag to stop on release, got ${JSON.stringify(painted)}`);
  }
});

test("Autofabulator merges new cells into an existing prefab block", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = { x: 2800, y: 1900 };
  const prefabType = await game.evaluate(({ x, y }) => {
    const cellIds = [
      [15, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const localized = sandkit.api.blueprints.localizeStructures([
      {
        type: "prefabTerrain_5",
        x: 0,
        y: 0,
        color: "#ffffff",
        data: {
          __prefabulatorBlueprint: {
            definition: {
              shape: cellIds.map((row) => row.map((cell) => (cell ? 1 : 0))),
              cellIds,
            },
          },
        },
      },
    ]);
    const type = localized[0]?.type;
    if (type === undefined) throw new Error("Could not localize the prefab fixture");
    sandkit.api.structures.buildAtCell(x, y, type);
    return type;
  }, origin);

  await game.waitFor(
    (cellX, cellY) => sandkit.api.structures.getAtCell(cellX, cellY)?.type ?? null,
    (type) => type === prefabType,
    { args: [origin.x, origin.y], message: "Initial prefab fixture was not built" },
  );
  await game.evaluate(async ({ x, y }) => {
    sandkit.api.player.setWorldPosition(x * 4 + 8, y * 4 + 8);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, origin);
  await game.evaluate(({ x, y }) => {
    const structure = sandkit.api.structures.getAtCell(x, y);
    if (!structure) throw new Error("Initial prefab structure disappeared");
    sandkit.api.structures.setData(structure, {
      __prefabulatorBlueprint: {
        definition: {
          shape: [
            [1, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
          ],
          cellIds: [
            [15, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
          ],
        },
      },
    });
  }, origin);

  const clickPoint = await game.evaluate(({ x, y }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    const renderer = (sandkit.engine.state.session as any).rendering?.pixi?.app?.renderer;
    const camera = (sandkit.engine.state.session as any).camera;
    return {
      x: rect.left + ((x * 4 + 8 - camera.x) / renderer.width) * rect.width,
      y: rect.top + ((y * 4 - camera.y) / renderer.height) * rect.height,
    };
  }, origin);
  await dispatchMouseClick(clickPoint.x, clickPoint.y);
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator editor did not open for the merge test" },
  );

  const cells = await game.evaluate(() => {
    const captured = [...document.querySelectorAll<HTMLElement>("[data-autofab-cell]")].find(
      (cell) => getComputedStyle(cell).backgroundColor === "rgb(222, 166, 31)",
    );
    const tile = captured?.closest<HTMLButtonElement>("button");
    const tileCells = tile?.querySelectorAll<HTMLElement>("[data-autofab-cell]");
    if (!tileCells || tileCells.length !== 16) {
      throw new Error("Captured prefab canvas cells were not found");
    }
    return [0, 1, 2].map((index) => {
      const rect = tileCells[index].getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  });
  await dispatchMouseEvent("mouseMoved", cells[0].x, cells[0].y);
  await dispatchMouseEvent("mousePressed", cells[0].x, cells[0].y, "right", 2);
  await dispatchMouseEvent("mouseReleased", cells[0].x, cells[0].y, "right");
  await dispatchMouseClick(cells[1].x, cells[1].y);
  await dispatchMouseClick(cells[2].x, cells[2].y);
  const paintedNewCell = await game.evaluate(({ x, y }) => {
    const cell = document.elementFromPoint(x, y);
    return cell instanceof HTMLElement ? getComputedStyle(cell).backgroundColor : null;
  }, cells[2]);
  if (paintedNewCell !== "rgb(222, 166, 31)") {
    throw new Error(`Expected adjacent prefab cell to be painted, got ${paintedNewCell}`);
  }

  const applyPoint = await game.evaluate(() => {
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (candidate) => candidate.textContent?.trim() === "Apply",
    );
    if (!button) throw new Error("Autofabulator Apply button was not found");
    const rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await dispatchMouseClick(applyPoint.x, applyPoint.y);

  await game.waitFor(
    (cellX, cellY) =>
      (sandkit.api.structures.getAtCell(cellX, cellY) as any)?.data?.__prefabulatorBlueprint
        ?.definition?.cellIds?.[0]?.[2] ?? 0,
    (cellId) => cellId !== 0,
    { args: [origin.x, origin.y], message: "Merged prefab fixture was not rebuilt" },
  );
  const result = await game.evaluate(
    ({ x, y }) => ({
      structure: sandkit.api.structures.getAtCell(x, y) ?? null,
      prefabRegistry: (sandkit.engine.state.store.mods as any).prefabulator?.prefabRegistry ?? null,
      cellIds: Array.from({ length: 4 }, (_, cellY) =>
        Array.from({ length: 4 }, (_, cellX) =>
          sandkit.api.world.getCellIdAtCell(x + cellX, y + cellY),
        ),
      ),
    }),
    origin,
  );
  if (result.structure === null || !String(result.structure.type).startsWith("prefabTerrain_")) {
    throw new Error(`Expected a merged prefab structure, got ${JSON.stringify(result.structure)}`);
  }
  if (result.cellIds[0][0] !== 0 || result.cellIds[0][1] === 0 || result.cellIds[0][2] === 0) {
    throw new Error(
      `Expected the erased cell to be gone and the new cells to remain, got ${JSON.stringify({ structure: result.structure, cellIds: result.cellIds })}`,
    );
  }
});

test("Autofabulator middle-click paints a Solidite cell", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = { x: 2900, y: 2000 };
  await game.evaluate(async ({ x, y }) => {
    sandkit.api.player.setWorldPosition(x * 4 + 8, y * 4 + 8);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, origin);

  const clickPoint = await game.evaluate(({ x, y }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Game canvas was not found");
    const rect = canvas.getBoundingClientRect();
    const renderer = (sandkit.engine.state.session as any).rendering?.pixi?.app?.renderer;
    const camera = (sandkit.engine.state.session as any).camera;
    return {
      x: rect.left + ((x * 4 + 8 - camera.x) / renderer.width) * rect.width,
      y: rect.top + ((y * 4 + 8 - camera.y) / renderer.height) * rect.height,
    };
  }, origin);
  await dispatchMouseClick(clickPoint.x, clickPoint.y);
  await game.waitFor(
    () => Boolean(document.body.textContent?.includes("5×5 Blueprint Blocks")),
    (open) => open,
    { message: "Autofabulator editor did not open for the middle-click test" },
  );

  const cell = await game.evaluate(() => {
    const tile = document.querySelector<HTMLButtonElement>('button[aria-label="block 3, 3"]');
    const target = tile?.querySelectorAll<HTMLElement>("span")[1];
    if (!target) throw new Error("Center canvas cell was not found");
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await dispatchMouseEvent("mouseMoved", cell.x, cell.y);
  await dispatchMouseEvent("mousePressed", cell.x, cell.y, "middle", 4);

  const background = await game.evaluate(() => {
    const tile = document.querySelector<HTMLButtonElement>('button[aria-label="block 3, 3"]');
    return getComputedStyle(tile?.querySelectorAll<HTMLElement>("span")[1]!).backgroundColor;
  });
  if (background === "rgba(0, 0, 0, 0)" || background === "transparent") {
    throw new Error("Middle-click did not paint a Solidite cell");
  }
});

test("Autofabulator Apply path replaces an obstructing element with an sspp block", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = await game.evaluate(() => {
    for (let y = 1600; y < 2000; y += 4) {
      for (let x = 2200; x < 2600; x += 4) {
        const clear = Array.from({ length: 4 }, (_, row) =>
          Array.from(
            { length: 4 },
            (_, col) =>
              sandkit.api.world.isCellEmptyAtCell(x + col, y + row) &&
              sandkit.api.structures.getAtCell(x + col, y + row) === null,
          ),
        ).every((row) => row.every(Boolean));
        if (clear) return { x, y };
      }
    }
    throw new Error("Could not find an empty area for the sspp test");
  });
  await game.evaluate(async ({ x, y }) => {
    sandkit.api.player.setWorldPosition(x * 4 + 8, y * 4 + 8);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, origin);

  await game.evaluate(({ x, y }) => {
    type PainterState = {
      originX: number;
      originY: number;
      painted: boolean[][][][];
      solidite: boolean[][][][];
      occupied: boolean[][][][];
    };
    const makeGrid = () =>
      Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () =>
          Array.from({ length: 4 }, () => Array<boolean>(4).fill(false)),
        ),
      );
    const painted = makeGrid();
    const solidite = makeGrid();
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 2; col += 1) solidite[2][2][row][col] = true;
      for (let col = 2; col < 4; col += 1) painted[2][2][row][col] = true;
    }
    const sandType = sandkit.api.elements.getTypeById("sand");
    if (sandType === null) throw new Error("Sand type is unavailable");
    sandkit.engine.api.elements?.createAt(sandkit.engine.state, x + 10, y + 8, sandType, {
      particle: { velocity: { x: 0, y: 1 } },
    });
    if (!sandkit.api.elements.getInfoAtCell(x + 10, y + 8)) {
      throw new Error("Could not seed the obstructing element");
    }
    const apply = (globalThis as Record<string, unknown>).__autofabulatorApply;
    if (typeof apply !== "function")
      throw new Error("Autofabulator Apply test hook is unavailable");
    (apply as (state: PainterState) => void)({
      originX: x,
      originY: y,
      painted,
      solidite,
      occupied: Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => Array(4).fill(false))),
      ),
    });
  }, origin);

  await game.waitFor(
    ({ x, y }) =>
      Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) =>
          sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8 + row),
        ),
      ),
    (cellIds) =>
      JSON.stringify(cellIds) === JSON.stringify(Array.from({ length: 4 }, () => [31, 31, 15, 15])),
    { args: [origin], message: "Apply path did not create the mixed sspp block" },
  );
  const result = await game.evaluate(({ x, y }) => {
    const structure = sandkit.api.structures.getAtCell(x + 10, y + 8);
    return {
      cellIds: Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) =>
          sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8 + row),
        ),
      ),
      structureType: structure?.type ?? null,
      structureQueued: Boolean(structure?.queued),
      obstructingElement: sandkit.api.elements.getInfoAtCell(x + 10, y + 8),
    };
  }, origin);
  const expected = Array.from({ length: 4 }, () => [31, 31, 15, 15]);
  if (JSON.stringify(result.cellIds) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected Solidite and prefab cells after Apply, got ${JSON.stringify(result)}`,
    );
  }
  if (!String(result.structureType).startsWith("prefabTerrain_")) {
    throw new Error(`Expected an owning prefab structure, got ${JSON.stringify(result)}`);
  }
  if (result.structureQueued) {
    throw new Error(`Expected a completed prefab structure, got ${JSON.stringify(result)}`);
  }
  if (result.obstructingElement !== null) {
    throw new Error(
      `Expected the obstructing element to be removed, got ${JSON.stringify(result)}`,
    );
  }
});

test("Autofabulator applies only dirty cells and ignores transparent-cell obstructions", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = await game.evaluate(() => {
    for (let y = 2200; y < 2600; y += 4) {
      for (let x = 2700; x < 3100; x += 4) {
        const clear = Array.from({ length: 4 }, (_, row) =>
          Array.from(
            { length: 4 },
            (_, col) =>
              sandkit.api.world.isCellEmptyAtCell(x + col, y + row) &&
              sandkit.api.structures.getAtCell(x + col, y + row) === null,
          ),
        ).every((row) => row.every(Boolean));
        if (clear) return { x, y };
      }
    }
    throw new Error("Could not find an empty area for the dirty-cell test");
  });

  await game.evaluate(({ x, y }) => {
    const makeGrid = () =>
      Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () =>
          Array.from({ length: 4 }, () => Array<boolean>(4).fill(false)),
        ),
      );
    const painted = makeGrid();
    const solidite = makeGrid();
    const initialPainted = makeGrid();
    const initialSolidite = makeGrid();
    const dirty = makeGrid();
    painted[2][2][0][3] = true;
    dirty[2][2][0][3] = true;

    const sandType = sandkit.api.elements.getTypeById("sand");
    if (sandType === null) throw new Error("Sand type is unavailable");
    sandkit.engine.api.elements?.createAt(sandkit.engine.state, x + 8, y + 8, sandType, {
      isFreeFalling: false,
    });
    sandkit.engine.api.elements?.createAt(sandkit.engine.state, x + 11, y + 8, sandType, {
      particle: { velocity: { x: 0, y: 1 } },
    });

    const apply = (globalThis as Record<string, unknown>).__autofabulatorApply;
    if (typeof apply !== "function") {
      throw new Error("Autofabulator Apply test hook is unavailable");
    }
    (apply as (state: Record<string, unknown>) => void)({
      originX: x,
      originY: y,
      painted,
      solidite,
      capturedSolidite: initialSolidite,
      initialPainted,
      initialSolidite,
      dirty,
      occupied: Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => Array(4).fill(false))),
      ),
    });
  }, origin);

  const result = await game.evaluate(({ x, y }) => {
    const structure = sandkit.api.structures.getAtCell(x + 11, y + 8);
    return {
      row: Array.from({ length: 4 }, (_, col) =>
        sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8),
      ),
      untouchedElement: sandkit.api.elements.getInfoAtCell(x + 8, y + 8),
      replacedElement: sandkit.api.elements.getInfoAtCell(x + 11, y + 8),
      structureType: structure?.type ?? null,
      structureQueued: Boolean(structure?.queued),
    };
  }, origin);

  if (!result.untouchedElement) {
    throw new Error(`Expected the untouched settled element to remain: ${JSON.stringify(result)}`);
  }
  if (result.replacedElement !== null || result.row[3] !== 15) {
    throw new Error(
      `Expected only the dirty prefab cell to replace sand: ${JSON.stringify(result)}`,
    );
  }
  if (!String(result.structureType).startsWith("prefabTerrain_") || result.structureQueued) {
    throw new Error(`Expected a completed owning prefab structure: ${JSON.stringify(result)}`);
  }
});

test("Autofabulator Apply path completes while the simulation is paused", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = await game.evaluate(() => {
    for (let y = 2600; y < 3000; y += 4) {
      for (let x = 2200; x < 2600; x += 4) {
        const clear = Array.from({ length: 4 }, (_, row) =>
          Array.from(
            { length: 4 },
            (_, col) =>
              sandkit.api.world.isCellEmptyAtCell(x + col, y + row) &&
              sandkit.api.structures.getAtCell(x + col, y + row) === null,
          ),
        ).every((row) => row.every(Boolean));
        if (clear) return { x, y };
      }
    }
    throw new Error("Could not find an empty area for the paused Apply test");
  });

  try {
    await game.pauseSimulation();
    await assertSimulationPaused();

    await game.evaluate(({ x, y }) => {
      type PainterState = {
        originX: number;
        originY: number;
        painted: boolean[][][][];
        solidite: boolean[][][][];
        capturedSolidite: boolean[][][][];
        occupied: boolean[][][][];
      };
      const makeGrid = () =>
        Array.from({ length: 5 }, () =>
          Array.from({ length: 5 }, () =>
            Array.from({ length: 4 }, () => Array<boolean>(4).fill(false)),
          ),
        );
      const painted = makeGrid();
      const solidite = makeGrid();
      const capturedSolidite = makeGrid();
      for (let row = 0; row < 4; row += 1) {
        solidite[2][2][row][0] = true;
        solidite[2][2][row][1] = true;
        painted[2][2][row][2] = true;
        painted[2][2][row][3] = true;
      }
      const apply = (globalThis as Record<string, unknown>).__autofabulatorApply;
      if (typeof apply !== "function")
        throw new Error("Autofabulator Apply test hook is unavailable");
      (apply as (state: PainterState) => void)({
        originX: x,
        originY: y,
        painted,
        solidite,
        capturedSolidite,
        occupied: Array.from({ length: 5 }, () =>
          Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => Array(4).fill(false))),
        ),
      });
    }, origin);

    await game.waitFor(
      ({ x, y }) =>
        Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) =>
            sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8 + row),
          ),
        ),
      (cellIds) =>
        JSON.stringify(cellIds) ===
        JSON.stringify(Array.from({ length: 4 }, () => [31, 31, 15, 15])),
      { args: [origin], message: "Paused Apply path did not create the mixed sspp block" },
    );

    await assertSimulationPaused();
  } finally {
    await game.resumeSimulation();
  }
});

test("Autofabulator Apply path replaces an sspp block with s..p", async () => {
  await dispatchKey("Escape");
  await game.resumeSimulation();

  const origin = await game.evaluate(() => {
    for (let y = 2100; y < 2500; y += 4) {
      for (let x = 2200; x < 2600; x += 4) {
        const clear = Array.from({ length: 4 }, (_, row) =>
          Array.from(
            { length: 4 },
            (_, col) =>
              sandkit.api.world.isCellEmptyAtCell(x + col, y + row) &&
              sandkit.api.structures.getAtCell(x + col, y + row) === null,
          ),
        ).every((row) => row.every(Boolean));
        if (clear) return { x, y };
      }
    }
    throw new Error("Could not find an empty area for the replacement test");
  });
  await game.evaluate(async ({ x, y }) => {
    sandkit.api.player.setWorldPosition(x * 4 + 8, y * 4 + 8);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, origin);

  await game.evaluate(({ x, y }) => {
    type PainterState = {
      originX: number;
      originY: number;
      painted: boolean[][][][];
      solidite: boolean[][][][];
      capturedSolidite: boolean[][][][];
      occupied: boolean[][][][];
    };
    const makeGrid = () =>
      Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () =>
          Array.from({ length: 4 }, () => Array<boolean>(4).fill(false)),
        ),
      );
    const applyPattern = (
      prefabColumns: number[],
      soliditeColumns: number[],
      capturedColumns: number[] = [],
    ) => {
      const painted = makeGrid();
      const solidite = makeGrid();
      const capturedSolidite = makeGrid();
      for (const col of prefabColumns) {
        for (let row = 0; row < 4; row += 1) painted[2][2][row][col] = true;
      }
      for (const col of soliditeColumns) {
        for (let row = 0; row < 4; row += 1) solidite[2][2][row][col] = true;
      }
      for (const col of capturedColumns) {
        for (let row = 0; row < 4; row += 1) capturedSolidite[2][2][row][col] = true;
      }
      const apply = (globalThis as Record<string, unknown>).__autofabulatorApply;
      if (typeof apply !== "function")
        throw new Error("Autofabulator Apply test hook is unavailable");
      (apply as (state: PainterState) => void)({
        originX: x,
        originY: y,
        painted,
        solidite,
        capturedSolidite,
        occupied: Array.from({ length: 5 }, () =>
          Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => Array(4).fill(false))),
        ),
      });
    };
    applyPattern([2, 3], [0, 1]);
  }, origin);

  const fullExpected = Array.from({ length: 4 }, () => [31, 31, 15, 15]);
  await game.waitFor(
    ({ x, y }) =>
      Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) =>
          sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8 + row),
        ),
      ),
    (cellIds) => JSON.stringify(cellIds) === JSON.stringify(fullExpected),
    { args: [origin], message: "Apply path did not create the initial sspp block" },
  );

  await game.evaluate(({ x, y }) => {
    const makeGrid = () =>
      Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () =>
          Array.from({ length: 4 }, () => Array<boolean>(4).fill(false)),
        ),
      );
    const painted = makeGrid();
    const solidite = makeGrid();
    const capturedSolidite = makeGrid();
    for (let row = 0; row < 4; row += 1) {
      painted[2][2][row][3] = true;
      solidite[2][2][row][0] = true;
      capturedSolidite[2][2][row][0] = true;
      capturedSolidite[2][2][row][1] = true;
    }
    const apply = (globalThis as Record<string, unknown>).__autofabulatorApply;
    if (typeof apply !== "function")
      throw new Error("Autofabulator Apply test hook is unavailable");
    (apply as (state: Record<string, unknown>) => void)({
      originX: x,
      originY: y,
      painted,
      solidite,
      capturedSolidite,
      occupied: Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => Array(4).fill(false))),
      ),
    });
  }, origin);

  const expected = Array.from({ length: 4 }, () => [31, 0, 0, 15]);
  await game.waitFor(
    ({ x, y }) =>
      Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) =>
          sandkit.api.world.getCellIdAtCell(x + 8 + col, y + 8 + row),
        ),
      ),
    (cellIds) => JSON.stringify(cellIds) === JSON.stringify(expected),
    { args: [origin], message: "Apply path did not replace sspp with s..p" },
  );
});
