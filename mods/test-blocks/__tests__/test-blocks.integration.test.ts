import assert from "node:assert/strict";
import test from "node:test";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

declare const sandkit: { api: Record<string, unknown> };

const game = await setupGame();

test("extracted game boots with Sandkit available", async () => {
  const hasApi = await game.evaluate(() => Boolean(sandkit?.api));
  assert.equal(hasApi, true);
});

test("Test Blocks is loaded as an external mod", async () => {
  const modIds = await game.orderedModIds();
  assert.ok(modIds.includes("sorahn.sandustry-test-blocks"));
});

test("Test Blocks registers and unlocks every structure", async () => {
  const structures = await game.evaluate(() => {
    const api = sandkit.api as unknown as {
      structures: {
        getTypeById(id: string): string | number | null;
        isUnlockedByType(type: string | number): boolean;
        getDefinitionByType?(type: string | number): {
          categoryKey?: string;
          order?: number;
          buildModes?: Array<{ type: string }>;
          shape?: number[][];
        } | null;
      };
    };
    return [
      "sandustryTestBlocksSource",
      "sandustryTestBlocksTrash",
      "sandustryTestBlocksThermalSource",
      "sandustryTestBlocksCold",
      "sandustryTestBlocksPower",
    ].map((id) => {
      const type = api.structures.getTypeById(id);
      const definition = type === null ? null : api.structures.getDefinitionByType?.(type);
      return {
        id,
        registered: type !== null,
        unlocked: type !== null && api.structures.isUnlockedByType(type),
        category: definition?.categoryKey ?? null,
        order: definition?.order ?? null,
        buildModes: definition?.buildModes?.map((mode) => mode.type) ?? [],
        shape: definition?.shape ?? null,
      };
    });
  });

  assert.deepEqual(
    structures.map(({ id, registered, unlocked }) => ({ id, registered, unlocked })),
    [
      "sandustryTestBlocksSource",
      "sandustryTestBlocksTrash",
      "sandustryTestBlocksThermalSource",
      "sandustryTestBlocksCold",
      "sandustryTestBlocksPower",
    ].map((id) => ({ id, registered: true, unlocked: true })),
  );
  assert.ok(structures.every((structure) => structure.category === "testBlocks"));
  assert.deepEqual(
    structures.map((structure) => structure.order),
    [10, 50, 20, 30, 40],
  );
  assert.ok(structures.every((structure) => structure.buildModes.includes("single")));
});

test("Test Blocks can build a multi-structure fixture in one batch", async () => {
  const placements = [
    { type: "sandustryTestBlocksThermalSource", x: 2008, y: 1612 },
    { type: "sandustryTestBlocksCold", x: 2016, y: 1612 },
    { type: "sandustryTestBlocksPower", x: 2024, y: 1612 },
    { type: "sandustryTestBlocksTrash", x: 2032, y: 1612 },
  ] as const;

  await game.buildStructures(placements);
  const built = await game.evaluate((items) => {
    const api = sandkit.api as unknown as {
      structures: {
        getAtCell(x: number, y: number): { type: string | number } | null;
      };
    };
    return items.map((item) => api.structures.getAtCell(item.x, item.y)?.type ?? null);
  }, placements);

  assert.deepEqual(
    built,
    placements.map((placement) => placement.type),
  );
});

test("Infinite Source emits the configured element without overwriting material", async () => {
  const source = { x: 2400, y: 1612 };
  const elements = await game.evaluate(() => ({
    copper: sandkit.api.elements.getTypeById("copper"),
    sand: sandkit.api.elements.getTypeById("sand"),
  }));
  assert.equal(typeof elements.copper, "number");
  assert.equal(typeof elements.sand, "number");
  await game.buildLayout({
    origin: { x: source.x - 4, y: source.y - 4 },
    phases: [
      {
        cells: ["fff", "f.f", "fff"],
        legend: { f: { type: "foundation" } },
      },
      {
        cells: ["...", ".s.", "..."],
        legend: {
          s: {
            type: "sandustryTestBlocksSource",
            data: { elementId: "copper", elementType: elements.copper },
          },
        },
      },
    ],
  });
  await game.evaluate(
    (x, y, sand) => {
      sandkit.api.elements.createAtCell(x, y, sand);
    },
    source.x,
    source.y,
    elements.sand,
  );
  await game.runSimulation(800);

  const observed = await game.evaluate(
    (x, y, copper, sand) => {
      const api = sandkit.api as unknown as {
        elements: { getTypeAtCell(x: number, y: number): number | null };
      };
      let copperCount = 0;
      let sandCount = 0;
      for (let row = 0; row < 64; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const type = api.elements.getTypeAtCell(x + column, y + row);
          if (type === copper) copperCount += 1;
          if (type === sand) sandCount += 1;
        }
      }
      return { copperCount, sandCount };
    },
    source.x,
    source.y,
    elements.copper,
    elements.sand,
  );

  assert.ok(observed.copperCount > 0, "Source did not emit copper into its output area");
  assert.ok(observed.sandCount > 0, "Source overwrote the pre-existing Sand output");
});

test("Heat and Chill exchange with thermal relays on every side", async () => {
  const heat = { x: 2200, y: 1800 };
  const chill = { x: 2300, y: 1800 };
  const directions = [
    { x: 0, y: -4 },
    { x: 0, y: 4 },
    { x: -4, y: 0 },
    { x: 4, y: 0 },
  ];
  const placements = [
    {
      type: "sandustryTestBlocksThermalSource",
      ...heat,
      data: { temperature: 0, targetTemperature: 1000 },
    },
    {
      type: "sandustryTestBlocksCold",
      ...chill,
      data: { temperature: 0, targetTemperature: -1000 },
    },
    ...directions.flatMap((direction) => [
      { type: "thermalRelay", x: heat.x + direction.x, y: heat.y + direction.y },
      { type: "thermalRelay", x: chill.x + direction.x, y: chill.y + direction.y },
    ]),
  ];

  await game.buildStructures(placements);
  await game.runSimulation(3200);

  const observed = await game.evaluate(
    (sources, offsets) => {
      const api = sandkit.api as unknown as {
        structures: {
          getAtCell(x: number, y: number): { data?: { temperature?: number } } | null;
        };
      };
      const read = (origin: { x: number; y: number }) => ({
        source: api.structures.getAtCell(origin.x, origin.y)?.data?.temperature ?? null,
        relays: offsets.map(
          (offset) =>
            api.structures.getAtCell(origin.x + offset.x, origin.y + offset.y)?.data?.temperature ??
            null,
        ),
      });
      return sources.map(read);
    },
    [heat, chill],
    directions,
  );

  assert.ok((observed[0]?.source ?? 0) > 900, "Heat did not reach its target temperature");
  assert.ok((observed[1]?.source ?? 0) < -900, "Chill did not reach its target temperature");
  assert.ok(
    observed[0]?.relays.every((temperature) => (temperature ?? 0) > 0),
    "Heat did not reach thermal relays on every side",
  );
  assert.ok(
    observed[1]?.relays.every((temperature) => (temperature ?? 0) < 0),
    "Chill did not reach thermal relays on every side",
  );
});

test("Infinite Trash clears its footprint without clearing adjacent cells", async () => {
  const trash = { x: 2600, y: 1800 };
  const sand = await game.evaluate(() => sandkit.api.elements.getTypeById("sand"));
  assert.equal(typeof sand, "number");

  await game.buildStructures([{ type: "sandustryTestBlocksTrash", ...trash }]);
  await game.evaluate(
    (x, y, elementType) => {
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          sandkit.api.elements.createAtCell(x + column, y + row, elementType);
          sandkit.api.elements.createAtCell(x + 4 + column, y + row, elementType);
        }
      }
    },
    trash.x,
    trash.y,
    sand,
  );
  await game.runSimulation(600);

  const observed = await game.evaluate(
    (x, y, elementType) => {
      let inside = 0;
      let outside = 0;
      for (let row = 0; row < 64; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          if (sandkit.api.elements.getTypeAtCell(x + column, y + row) === elementType) inside += 1;
          if (sandkit.api.elements.getTypeAtCell(x + 4 + column, y + row) === elementType)
            outside += 1;
        }
      }
      return { inside, outside };
    },
    trash.x,
    trash.y,
    sand,
  );

  assert.equal(observed.inside, 0, "Trash left material inside its footprint");
  assert.ok(observed.outside > 0, "Trash cleared material outside its footprint");
});

test("Infinite Power fills and recovers its storage and global energy pool", async () => {
  const power = { x: 2800, y: 1800 };
  await game.buildStructures([
    {
      type: "sandustryTestBlocksPower",
      ...power,
      data: { storedEnergy: 0, maxEnergy: 0 },
    },
  ]);
  await game.runSimulation(1200);

  const observed = await game.evaluate(
    (x, y) => {
      const state = sandkit.engine.state as {
        store?: { resources?: { energy?: number } };
        shared?: { energy?: Uint32Array };
      };
      const structure = sandkit.api.structures.getAtCell(x, y) as {
        data?: { storedEnergy?: number; maxEnergy?: number };
      } | null;
      return {
        storedEnergy: structure?.data?.storedEnergy ?? null,
        maxEnergy: structure?.data?.maxEnergy ?? null,
        globalEnergy: state.shared?.energy
          ? Atomics.load(state.shared.energy, 0)
          : (state.store?.resources?.energy ?? null),
      };
    },
    power.x,
    power.y,
  );

  assert.equal(observed.storedEnergy, 1_000_000);
  assert.equal(observed.maxEnergy, 1_000_000);
  assert.equal(observed.globalEnergy, 1_000_000);

  const drained = await game.evaluate(
    (x, y) => {
      const structure = sandkit.api.structures.getAtCell(x, y) as {
        data?: { storedEnergy?: number; maxEnergy?: number };
      } | null;
      if (!structure) throw new Error("Power structure was not found after filling");
      const consumed = sandkit.api.energy.consume(250_000);
      sandkit.api.structures.setData(structure, {
        ...structure.data,
        storedEnergy: 250_000,
        maxEnergy: 1_000_000,
      });
      return consumed;
    },
    power.x,
    power.y,
  );
  assert.equal(drained, 250_000);

  await game.runSimulation(1200);
  const recovered = await game.evaluate(
    (x, y) => {
      const state = sandkit.engine.state as {
        shared?: { energy?: Uint32Array };
        store?: { resources?: { energy?: number } };
      };
      const structure = sandkit.api.structures.getAtCell(x, y) as {
        data?: { storedEnergy?: number };
      } | null;
      return {
        storedEnergy: structure?.data?.storedEnergy ?? null,
        globalEnergy: state.shared?.energy
          ? Atomics.load(state.shared.energy, 0)
          : (state.store?.resources?.energy ?? null),
      };
    },
    power.x,
    power.y,
  );

  assert.equal(recovered.storedEnergy, 1_000_000);
  assert.equal(recovered.globalEnergy, 1_000_000);
});

test("Infinite Power removes its contribution when demolished", async () => {
  const power = { x: 2800, y: 1800 };
  await game.evaluate(
    (x, y) => {
      sandkit.api.structures.removeAtCellWhenIdle(x, y);
    },
    power.x,
    power.y,
  );
  await game.runSimulation(100);

  const afterFullRemoval = await game.evaluate(
    (x, y) => ({
      exists: Boolean(sandkit.api.structures.getAtCell(x, y)),
      globalEnergy: Atomics.load(sandkit.engine.state.shared.energy, 0),
    }),
    power.x,
    power.y,
  );
  assert.equal(afterFullRemoval.exists, false);
  assert.equal(afterFullRemoval.globalEnergy, 0);

  await game.runSimulation(1200);
  const drained = await game.evaluate(() => sandkit.api.energy.consume(750_000));
  assert.equal(drained, 750_000);

  const remainingPower = { x: 2024, y: 1612 };
  await game.evaluate(
    (x, y) => {
      sandkit.api.structures.removeAtCellWhenIdle(x, y);
    },
    remainingPower.x,
    remainingPower.y,
  );
  await game.runSimulation(100);

  const afterPartialRemoval = await game.evaluate(
    (x, y) => ({
      exists: Boolean(sandkit.api.structures.getAtCell(x, y)),
      globalEnergy: Atomics.load(sandkit.engine.state.shared.energy, 0),
    }),
    remainingPower.x,
    remainingPower.y,
  );
  assert.equal(afterPartialRemoval.exists, false);
  assert.equal(afterPartialRemoval.globalEnergy, 0);
});
