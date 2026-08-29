"use strict";

const api = sandkit.api;
const engine = sandkit.engine as any;
const MOD_ID = "sorahn.sandustry-splitter";
const SPLITTER_ID = "sandustrySplitter";
const SPLITTER_SPRITE_ID = "sandustrySplitterSprite";
const SPLITTER_PLACEMENT_ID = `${MOD_ID}:placement`;

api.i18n.register("en", {
  "structures|splitter|name": "Splitter",
  "structures|splitter|description":
    "Routes particles alternately left and right without storing or cloning them.",
});

const setup = async () => {
  await api.sprites.loadFromMod(SPLITTER_SPRITE_ID, "assets/splitter.png");

  (api.structures as any).register({
    id: SPLITTER_ID,
    nameKey: "structures|splitter|name",
    descriptionKey: "structures|splitter|description",
    categoryKey: "production",
    order: 0,
    alwaysUnlocked: true,
    useRawShape: true,
    buildModes: [{ type: "single" }],
    copyData: false,
    shape: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    defaultData: { nextSide: "left" },
    variants: [{ id: SPLITTER_ID, angles: [0, 90, 180, 270] }],
    render: {
      imageName: SPLITTER_SPRITE_ID,
      size: { width: 16, height: 16 },
      offset: { x: 0, y: 0 },
      ui: { outline: true },
    },
  });

  engine.api.misc.register(engine.state, {
    id: SPLITTER_PLACEMENT_ID,
    onStructuresPlaced: (_state: any, placement: any) => {
      for (const position of placement.positions ?? []) {
        if (position.structureType === SPLITTER_ID) position.clearance = 1;
      }
      return false;
    },
  });

  api.player.buildings.unlockByType(SPLITTER_ID);
};

void setup().catch((error) => {
  console.error(`[${MOD_ID}] load failed:`, error);
});
