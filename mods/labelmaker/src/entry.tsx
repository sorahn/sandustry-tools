import { encodeBlueprint } from "@sandustry/blueprint-core";
import { createLabelBlueprint } from "~shared/labelmaker-blueprint";

const api = sandkit.api;
const MOD_ID = "sorahn.sandustry-labelmaker";
const ITEM_ID = "sorahnLabelmaker";
const TOOL_SPRITE_ID = "sorahnLabelmakerSprite";
const LAST_BLUEPRINT_KEY = `${MOD_ID}.lastBlueprint`;
const ACTION_START = 1;
let promptOpen = false;

api.i18n.register("en", {
  "mods|labelmaker|name": "Labelmaker",
  "mods|labelmaker|description": "Generate pixel-font label blueprints.",
  "mods|labelmaker|prompt": "Enter a label (ASCII 32–127):",
});

await api.sprites.loadFromMod(TOOL_SPRITE_ID, "assets/labelmaker.png");

async function openLabelmaker(): Promise<void> {
  if (promptOpen) return;
  promptOpen = true;
  const entered = await api.ui.prompt("Enter a label (ASCII 32–127):", "", "Label", "Labelmaker");
  promptOpen = false;
  if (entered === null) return;
  const text = entered;
  if (!text.length) {
    api.ui.toast("Labelmaker: enter at least one character.");
    return;
  }
  if (
    [...text].some((character) => {
      const code = character.codePointAt(0) ?? -1;
      return code < 32 || code > 127;
    })
  ) {
    api.ui.toast("Labelmaker: use only ASCII characters 32–127.");
    return;
  }

  const blueprint = createLabelBlueprint(text);
  const encoded = encodeBlueprint(blueprint);
  api.storage.local.set(LAST_BLUEPRINT_KEY, encoded);
  api.ui.toast(
    `Labelmaker: generated ${blueprint.data.length} prefab Blocks. Blueprint handoff is next.`,
  );
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
});

api.i18n.register("en", {
  "items|labelmaker|name": "Labelmaker",
  "items|labelmaker|description": "Click to generate a pixel-font label blueprint.",
});

api.events.on("game:ready", () => {
  api.player.inventory.addFromId(ITEM_ID);
});
