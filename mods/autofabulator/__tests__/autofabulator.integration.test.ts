import { test } from "node:test";
import { setupGame } from "../../../resources/SandustryModTemplate/modkit/test/setup-game.ts";

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
      y: rect.top + ((y * 4 + 8 - camera.y) / renderer.height) * rect.height,
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
