import { encodeBlueprint } from "@sandustry/blueprint-core";
import { createLabelBlueprint } from "./blueprint";
import {
  activateCopierPlacement,
  clearNativePlacementCursor,
  inventoryContains,
  isCopierAction,
  isCopierSelected,
  localizeLabelStructures,
  restoreLabelmakerAction,
} from "./native-placement";
import {
  getBundledFont,
  getBundledFontIds,
  getBundledFontOptions,
  loadBundledFonts,
} from "./fonts/registry";
import { cancelLabelmakerPrompt, openLabelmakerPrompt } from "./prompt";

const api = sandkit.api;
const ITEM_ID = "sorahnLabelmaker";
const TOOL_SPRITE_ID = "sorahnLabelmakerSprite";
const ACTION_START = 1;
const LABELMAKER_NAME = "Labelmaker";
const LABELMAKER_MAX_CHARACTERS = 64;
const LABEL_PROMPT =
  "Enter a label (common keyboard characters and symbols are supported; unsupported characters become blank glyphs):";
const MOD_TRANSLATIONS = {
  "mods|labelmaker|name": LABELMAKER_NAME,
  "mods|labelmaker|description": "Generate pixel-font label blueprints.",
  "mods|labelmaker|prompt": LABEL_PROMPT,
};
const ITEM_TRANSLATIONS = {
  "items|labelmaker|name": LABELMAKER_NAME,
  "items|labelmaker|description":
    "Click to generate a label blueprint using letters A–Z and spaces.",
};
let promptOpen = false;
let cursorActive = false;
let selectedFontId = getBundledFontIds()[0] ?? "";

async function openLabelmaker(): Promise<void> {
  if (promptOpen) {
    // A dev reload can remove the injected component while leaving this flag set.
    cancelLabelmakerPrompt();
    promptOpen = false;
  }
  promptOpen = true;
  try {
    const result = await openLabelmakerPrompt(
      LABEL_PROMPT,
      "",
      "Label",
      LABELMAKER_NAME,
      getBundledFontOptions(),
      selectedFontId,
    );
    if (result === null) return;
    selectedFontId = result.fontId;
    if (!result.text.length) {
      api.ui.toast("Labelmaker: enter at least one character.");
      return;
    }
    if ([...result.text].length > LABELMAKER_MAX_CHARACTERS) {
      api.ui.toast(
        `Labelmaker: label is too long. Use ${LABELMAKER_MAX_CHARACTERS} characters or fewer.`,
      );
      return;
    }

    const blueprint = createLabelBlueprint(result.text, getBundledFont(result.fontId));
    encodeBlueprint(blueprint);
    const cursorStructures = localizeLabelStructures(blueprint.data);
    if (!cursorStructures?.length) {
      api.ui.toast("Labelmaker: could not prepare the placement cursor.");
      return;
    }

    if (!activateCopierPlacement(cursorStructures)) {
      api.ui.toast("Labelmaker: the placement cursor is unavailable.");
      return;
    }
    cursorActive = true;
    api.ui.toast(`Labelmaker: ${cursorStructures.length} prefab Blocks ready to place.`);
  } catch (error) {
    console.error("[Labelmaker] Failed to generate label:", error);
    api.ui.toast("Labelmaker: failed to generate the label.");
  } finally {
    promptOpen = false;
  }
}

function clearLabelmakerCursor(restoreLabelmaker = false): void {
  const customData = (
    sandkit.engine.state?.store?.player?.action as
      | { customData?: { __labelmakerCursor?: boolean } | null }
      | undefined
  )?.customData;
  if (!cursorActive && !promptOpen && !customData?.__labelmakerCursor) return;
  cancelLabelmakerPrompt();
  promptOpen = false;
  cursorActive = false;
  clearNativePlacementCursor();
  if (restoreLabelmaker) {
    restoreLabelmakerAction(ITEM_ID);
  }
}

function registerLabelmaker(): void {
  api.items.register({
    id: ITEM_ID,
    nameKey: "items|labelmaker|name",
    descriptionKey: "items|labelmaker|description",
    categoryKey: "utility",
    sprite: {
      id: TOOL_SPRITE_ID,
      type: "backhand",
    },
    handleAction: (state) => {
      if (state?.session?.action?.state?.[ACTION_START]) void openLabelmaker();
    },
    afterRender: (state) => {
      if (!cursorActive || !isCopierAction(state)) return;
      if (state?.session?.action?.customData) return;
      cursorActive = false;
      restoreLabelmakerAction(ITEM_ID, state);
    },
  });

  api.i18n.register("en", ITEM_TRANSLATIONS);

  api.input.registerBinding("LabelmakerCancel", ["MouseRight"], {
    displayName: LABELMAKER_NAME,
    category: "utility",
    handlers: {
      down: () => clearLabelmakerCursor(true),
    },
  });

  api.events.on("action:changed", () => {
    const selected = api.action?.getSelected();
    if (
      (cursorActive || promptOpen) &&
      selected?.id !== ITEM_ID &&
      !isCopierSelected(selected?.id)
    ) {
      clearLabelmakerCursor();
    }
  });

  api.events.on("game:ready", () => {
    if (inventoryContains(ITEM_ID)) return;
    api.player.inventory.addFromId(ITEM_ID);
  });
}

async function initialize(): Promise<void> {
  api.i18n.register("en", MOD_TRANSLATIONS);

  try {
    await loadBundledFonts(api);
  } catch (error) {
    console.error("[Labelmaker] Failed to load bundled fonts:", error);
    api.ui.toast("Labelmaker: bundled fonts could not be loaded.");
    return;
  }

  try {
    await api.sprites.loadFromMod(TOOL_SPRITE_ID, "assets/labelmaker.png");
  } catch (error) {
    console.error("[Labelmaker] Failed to load labelmaker sprite:", error);
  }

  try {
    registerLabelmaker();
  } catch (error) {
    console.error("[Labelmaker] Failed to register Labelmaker:", error);
  }
}

initialize().catch((error) => console.error("[Labelmaker] Initialization failed:", error));
