"use strict";

const api = sandkit.api as any;
const engine = sandkit.engine as any;
const MOD_ID = "sorahn.sandustry-splitter";
const SPLITTER_ID = "sandustrySplitter";
const SPLITTER_SPRITE_ID = "sandustrySplitterSprite";
const SPLITTER_PLACEMENT_ID = `${MOD_ID}:placement`;
const PREFERENCES = ["even", "left", "right"] as const;
type Preference = (typeof PREFERENCES)[number];

api.i18n.register("en", {
  "structures|splitter|name": "Splitter",
  "structures|splitter|description":
    "Routes particles alternately left and right without storing or cloning them.",
  "structures|splitter|preference|even": "Even",
  "structures|splitter|preference|left": "Left",
  "structures|splitter|preference|right": "Right",
});

const preferenceLabel = (preference: Preference) =>
  preference === "left" ? "Left" : preference === "right" ? "Right" : "Even";

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
    defaultData: { preference: "even", nextSide: "left" },
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

  let interactableRegistered = false;
  const registerInteractable = () => {
    if (interactableRegistered) return;
    const register = (api.signals as any)?.interactables?.register;
    if (typeof register !== "function") {
      console.warn(`[${MOD_ID}] signal interactable registration is unavailable`);
      return;
    }
    register(SPLITTER_ID, (structure: any) => {
      const current = PREFERENCES.includes(structure.data?.preference)
        ? structure.data.preference
        : "even";
      const next = PREFERENCES[(PREFERENCES.indexOf(current) + 1) % PREFERENCES.length];
      api.structures.updateData(structure, { preference: next }, { propagateToWorkers: true });
      api.ui.toast(`Splitter: ${preferenceLabel(next)}`);
    });
    interactableRegistered = true;
  };
  api.events.on("game:ready", registerInteractable);

  api.player.buildings.unlockByType(SPLITTER_ID);
};

void setup().catch((error) => {
  console.error(`[${MOD_ID}] load failed:`, error);
});
