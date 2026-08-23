import { encodeBlueprint } from "@sandustry/blueprint-core";
import { createLabelBlueprint } from "./blueprint";
import { sanitizeLabel } from "./font";

const api = sandkit.api;
const ITEM_ID = "sorahnLabelmaker";
const TOOL_SPRITE_ID = "sorahnLabelmakerSprite";
const ACTION_START = 1;
const ACTION_TYPE_TOOL = 3;
const ACTION_TYPE_MOD = 4;
const COPIER_ID = 7;
const COPYING_MODE = 2;
let promptOpen = false;
let cursorActive = false;

api.i18n.register("en", {
  "mods|labelmaker|name": "Labelmaker",
  "mods|labelmaker|description": "Generate pixel-font label blueprints.",
  "mods|labelmaker|prompt": "Enter a label (letters A–Z and spaces):",
});

await api.sprites.loadFromMod(TOOL_SPRITE_ID, "assets/labelmaker.png");

async function openLabelmaker(): Promise<void> {
  if (promptOpen) return;
  promptOpen = true;
  const entered = await api.ui.prompt(
    "Enter a label (letters A–Z and spaces):",
    "",
    "Label",
    "Labelmaker",
  );
  promptOpen = false;
  if (entered === null) return;
  const sanitized = sanitizeLabel(entered);
  if (sanitized.removed) {
    api.ui.toast("Labelmaker: unsupported characters have been removed");
  }
  const text = sanitized.text;
  if (!text.length) {
    api.ui.toast("Labelmaker: enter at least one character.");
    return;
  }

  const blueprint = createLabelBlueprint(text);
  encodeBlueprint(blueprint);
  const localizeBlueprintStructures = (sandkit.engine.api as any).prefabulator
    ?.localizeBlueprintStructures;
  const cursorStructures = localizeBlueprintStructures
    ? blueprint.data.flatMap((structure) => localizeBlueprintStructures([structure]))
    : blueprint.data;
  if (!cursorStructures?.length) {
    api.ui.toast("Labelmaker: could not prepare the placement cursor.");
    return;
  }

  const minX = Math.min(...cursorStructures.map((structure: any) => structure.x));
  const maxX = Math.max(...cursorStructures.map((structure: any) => structure.x));
  const minY = Math.min(...cursorStructures.map((structure: any) => structure.y));
  const maxY = Math.max(...cursorStructures.map((structure: any) => structure.y));
  if (!api.action) {
    api.ui.toast("Labelmaker: the placement cursor is unavailable.");
    return;
  }
  api.action.setCustomData({
    selectedStructures: cursorStructures,
    signalLinks: null,
    mode: COPYING_MODE,
    marqueeSelected: true,
    mouseOffset: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  });

  // Reuse the game's native Copier placement and preview. This changes only
  // the active action; the blueprint is not written to clipboard/history.
  const state = sandkit.engine?.state as any;
  if (state?.store?.player) {
    state.store.player.action = { type: ACTION_TYPE_TOOL, id: COPIER_ID };
    state.store.player.hotbar.activeSlotIndex = null;
  }
  cursorActive = true;
  api.input.resetMouseState();
  api.ui.toast(`Labelmaker: ${cursorStructures.length} prefab Blocks ready to place.`);
}

function clearLabelmakerCursor(restoreLabelmaker = false): void {
  if (!cursorActive && !promptOpen) return;
  cursorActive = false;
  api.action?.setCustomData(null);
  if (restoreLabelmaker) {
    restoreLabelmakerAction(sandkit.engine?.state as any);
  }
}

function restoreLabelmakerAction(state: any): void {
  if (state?.store?.player) {
    state.store.player.action = { type: ACTION_TYPE_MOD, id: ITEM_ID };
    state.store.player.hotbar.activeSlotIndex = null;
  }
}

api.items.register({
  id: ITEM_ID,
  nameKey: "items|labelmaker|name",
  descriptionKey: "items|labelmaker|description",
  categoryKey: "utility",
  sprite: {
    id: TOOL_SPRITE_ID,
    type: "backhand",
  },
  handleAction: (state: any) => {
    if (state?.session?.action?.state?.[ACTION_START]) void openLabelmaker();
  },
  afterRender: (state: any) => {
    if (!cursorActive || state?.store?.player?.action?.id !== COPIER_ID) return;
    if (state?.session?.action?.customData) return;
    cursorActive = false;
    restoreLabelmakerAction(state);
  },
});

api.i18n.register("en", {
  "items|labelmaker|name": "Labelmaker",
  "items|labelmaker|description":
    "Click to generate a label blueprint using letters A–Z and spaces.",
});

api.input.registerBinding("LabelmakerCancel", ["MouseRight"], {
  displayName: "Labelmaker",
  category: "utility",
  handlers: {
    down: () => clearLabelmakerCursor(true),
  },
});

api.events.on("action:changed", () => {
  const selected = api.action?.getSelected();
  if (cursorActive && selected?.id !== ITEM_ID && String(selected?.id) !== String(COPIER_ID)) {
    clearLabelmakerCursor();
  }
});

api.events.on("game:ready", () => {
  api.player.inventory.addFromId(ITEM_ID);
});
