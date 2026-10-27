import assert from "node:assert/strict";
import { test } from "node:test";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

const game = await setupGame();

type Point = { x: number; y: number };

async function storedSelection(): Promise<unknown> {
  return game.evaluate(() =>
    sandkit.api.storage.local.get("sorahn.sandustry-filtered-lenses.element"),
  );
}

async function selectFilter(ids: string[]): Promise<void> {
  await game.evaluate((selected) => {
    sandkit.api.storage.local.set(
      "sorahn.sandustry-filtered-lenses.element",
      `terrain:${selected.join(",")}`,
    );
  }, ids);
}

async function openPicker(): Promise<void> {
  await game.evaluate(() => {
    sandkit.api.input.triggerBinding("sorahn.sandustry-filtered-lenses:configure");
  });
  await game.waitFor(
    () => Boolean(document.querySelector('input[placeholder="Search terrain..."]')),
    Boolean,
    { message: "Filtered Lenses picker did not open" },
  );
}

async function clickButton(label: string, checkbox = false): Promise<void> {
  await game.evaluate(
    ({ label, checkbox }) => {
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (node) =>
          node.innerText.replaceAll("✓", "").trim() === label ||
          Array.from(node.querySelectorAll("span")).some((span) => span.innerText.trim() === label),
      );
      if (!button) {
        throw new Error(`Picker button not found: ${label}`);
      }
      const target = checkbox
        ? button.parentElement?.querySelector<HTMLButtonElement>("button")
        : button;
      if (!target) {
        throw new Error(`Picker checkbox not found: ${label}`);
      }
      target.click();
    },
    { label, checkbox },
  );
}

async function intercept(itemId = "laser", patternSize = 7): Promise<Record<string, unknown>> {
  return game.evaluate(
    ({ itemId, patternSize }) => {
      const prepared = {
        excavationPower: 1,
        patternSize,
        energyCost: 120,
        chargeMs: 500,
        debrisEjectionSpeedPixelsPerSecond: 450,
        beamColor: 0xff0000,
      };
      const cancelled = (sandkit.engine.api as any).hooks.runInterceptors(
        sandkit.engine.state,
        "item:use",
        { itemId, kind: "chargeThenFire", prepared },
      );
      return { ...prepared, cancelled };
    },
    { itemId, patternSize },
  );
}

async function terrainFixture(points: Array<Point & { terrain: string }>): Promise<void> {
  await game.resumeSimulation();
  await game.evaluate((cells) => {
    for (const cell of cells) {
      const dimensions = (sandkit.api.grid as any).getDimensions();
      if (cell.x < 0 || cell.y < 0 || cell.x >= dimensions.width || cell.y >= dimensions.height) {
        throw new Error(
          `Terrain fixture is outside the test world: ${JSON.stringify({ cell, dimensions })}`,
        );
      }
      const type = (sandkit.api.terrains as any).getTypeById(cell.terrain);
      if (typeof type !== "number") {
        throw new Error(`Missing terrain ${cell.terrain}`);
      }
      if (sandkit.api.terrains.getTypeAtCell(cell.x, cell.y) == null) {
        (sandkit.api.terrains as any).createAtCell(cell.x, cell.y, type);
      } else {
        (sandkit.api.terrains as any).replaceAtCell(cell.x, cell.y, type);
      }
    }
  }, points);
  await game.waitFor(
    (cells) =>
      cells.every(
        (cell) =>
          sandkit.api.terrains.getTypeAtCell(cell.x, cell.y) ===
          (sandkit.api.terrains as any).getTypeById(cell.terrain),
      ),
    Boolean,
    { args: [points], message: "Terrain fixture was not placed" },
  );
  await game.evaluate((cells) => {
    for (const cell of cells) {
      (sandkit.api.terrains as any).setHitPointsAtCell(cell.x, cell.y, 1);
    }
  }, points);
}

async function usedLaser(target: Point, patternSize: number): Promise<void> {
  // Exercise the mod's real native event subscription and excavation API with
  // a synthetic prepared laser use. This does not simulate a charged mouse shot.
  await game.evaluate(
    ({ target, patternSize }) => {
      (sandkit.engine.api as any).events.emit(sandkit.engine.state, "item:used", {
        itemId: "laser",
        cellX: target.x,
        cellY: target.y,
        prepared: { patternSize, debrisEjectionSpeedPixelsPerSecond: 450 },
      });
    },
    { target, patternSize },
  );
}

async function assertTerrain(points: Array<Point & { terrain: string | null }>): Promise<void> {
  await game.waitFor(
    (cells) =>
      cells.map((cell) => {
        const type = sandkit.api.terrains.getTypeAtCell(cell.x, cell.y);
        return type == null ? null : sandkit.api.terrains.getIdByType(type);
      }),
    (actual) => JSON.stringify(actual) === JSON.stringify(points.map((cell) => cell.terrain)),
    { args: [points], message: `Unexpected excavation result for ${JSON.stringify(points)}` },
  );
}

test("upgrade registration and purchase gating preserve the native laser", async () => {
  await game.resumeSimulation();
  await selectFilter(["stone"]);
  const registration = await game.evaluate(() => {
    const state = sandkit.engine.state as any;
    const upgrade = state.sandkit.mods.upgrading.laser.upgrades.filteredLenses;
    return {
      level: sandkit.api.upgrades.getLevelById("laser", "filteredLenses"),
      maxLevel: upgrade.maxLevel,
      costs: upgrade.costs,
      binding:
        typeof state.sandkit.keyBindings["sorahn.sandustry-filtered-lenses:configure"]?.handlers
          ?.down,
    };
  });
  assert.deepEqual(registration, { level: 0, maxLevel: 1, costs: [5000], binding: "function" });
  assert.equal((await intercept()).excavationPower, 1);
});

test("purchased upgrade opens the picker and discovers new 0.6 terrains", async () => {
  await game.evaluate(() => {
    const api = sandkit.api as any;
    // Fixture represents an already purchased upgrade; setLevelById only
    // selects levels up to availableLevel and cannot grant the purchase.
    (sandkit.engine.state.store as any).upgrades.laser.filteredLenses.availableLevel = 1;
    api.upgrades.setLevelById("laser", "filteredLenses", 1);
    api.player.inventory.addFromId("laser");
    api.ui.hotbar.selectAction({ id: "laser", type: 2 });
  });
  await game.waitFor(
    () => sandkit.api.action?.getSelected()?.id,
    (id) => id === "laser",
  );
  await openPicker();
  const text = await game.evaluate(() => document.body.innerText);
  assert.ok(text.includes("Pentlandite"), "new nickel-bearing terrain is missing");
  assert.ok(text.includes("Stone"));
  await game.screenshot({ path: ".tmp/filtered-lenses-picker-0.6.png" });
});

test("picker search finds new terrains and clears without changing selection", async () => {
  const saved = await storedSelection();
  await game.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="Search terrain..."]',
    );
    if (!input) {
      throw new Error("Terrain search input is unavailable");
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "pentlandite");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await game.waitFor(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (button) => button.innerText.replaceAll("✓", "").trim() === "Stone",
      ),
    (visible) => !visible,
  );
  const text = await game.evaluate(() => document.body.innerText);
  assert.ok(text.includes("Pentlandite"));
  await game.evaluate(() => {
    const clear = document.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]');
    if (!clear) {
      throw new Error("Search clear button is unavailable");
    }
    clear.click();
  });
  await game.waitFor(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (button) => button.innerText.replaceAll("✓", "").trim() === "Stone",
      ),
    Boolean,
  );
  assert.equal(await storedSelection(), saved);
});

test("single selection, multi-selection, minimize and reopen persist terrain IDs", async () => {
  await clickButton("Stone");
  await game.waitFor(
    () => sandkit.api.storage.local.get("sorahn.sandustry-filtered-lenses.element"),
    (saved) => saved === "terrain:stone",
  );
  await openPicker();
  await clickButton("Dirt", true);
  await game.waitFor(
    () => sandkit.api.storage.local.get("sorahn.sandustry-filtered-lenses.element"),
    (saved) => saved === "terrain:stone,dirt",
  );
  await clickButton("Minimize ▾");
  await game.waitFor(
    () => !document.querySelector('input[placeholder="Search terrain..."]'),
    Boolean,
  );
  await openPicker();
  assert.equal(await storedSelection(), "terrain:stone,dirt");
  const selected = await game.evaluate(() => document.body.innerText);
  assert.ok(selected.includes("Stone") && selected.includes("Dirt"));
});

test("filtering changes excavation only, preserving native charge, cost, beam and overcharge size", async () => {
  await selectFilter(["stone"]);
  const result = await intercept("laser", 11);
  assert.deepEqual(result, {
    excavationPower: 0,
    patternSize: 11,
    energyCost: 120,
    chargeMs: 500,
    debrisEjectionSpeedPixelsPerSecond: 450,
    beamColor: 0xff0000,
    cancelled: false,
  });
  assert.equal((await intercept("drill")).excavationPower, 1);
});

test("selective excavation removes matching terrain and preserves adjacent unselected terrain", async () => {
  await selectFilter(["stone"]);
  const center = { x: 600, y: 600 };
  const outside = { x: 601, y: 600 };
  await terrainFixture([
    { ...center, terrain: "stone" },
    { ...outside, terrain: "dirt" },
  ]);
  await usedLaser(center, 7);
  await assertTerrain([
    { ...center, terrain: null },
    { ...outside, terrain: "dirt" },
  ]);
});

test("wider prepared laser patterns mine selected terrain beyond the default radius", async () => {
  await selectFilter(["stone", "pentlandite"]);
  const center = { x: 620, y: 600 };
  const widened = { x: 624, y: 600 };
  const preserved = { x: 621, y: 600 };
  await terrainFixture([
    { ...center, terrain: "pentlandite" },
    { ...widened, terrain: "stone" },
    { ...preserved, terrain: "dirt" },
  ]);
  await usedLaser(center, 11);
  await assertTerrain([
    { ...center, terrain: null },
    { ...widened, terrain: null },
    { ...preserved, terrain: "dirt" },
  ]);
});

test("No filter restores native behavior and switching tools hides the picker", async () => {
  await clickButton("[No filter]");
  assert.equal(await storedSelection(), "terrain:no-filter");
  assert.equal((await intercept()).excavationPower, 1);
  const point = { x: 640, y: 600 };
  await terrainFixture([{ ...point, terrain: "stone" }]);
  await usedLaser(point, 11);
  await assertTerrain([{ ...point, terrain: "stone" }]);
  const otherTool = await game.evaluate(() => {
    const inventory = sandkit.engine.state.store.player.inventory as Array<{ id?: string }>;
    const tool = inventory.find((item) => typeof item.id === "string" && item.id !== "laser");
    if (!tool?.id) {
      throw new Error("No other native inventory item is available to select");
    }
    sandkit.api.ui.hotbar.selectAction({ id: tool.id, type: 2 });
    return tool.id;
  });
  await game.waitFor(
    () => sandkit.api.action?.getSelected()?.id,
    (id) => id === otherTool,
  );
  await game.waitFor(
    () =>
      Array.from(document.querySelectorAll("span")).some(
        (span) => span.textContent === "Laser filter",
      ),
    (visible) => !visible,
  );
});
