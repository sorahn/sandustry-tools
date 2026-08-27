/**
 * Compatibility boundary for Sandustry's internal Copier placement state.
 * Keep bundle-dependent state shapes and numeric action IDs in this file so
 * future runtime changes do not spread through the Labelmaker flow.
 */

export const COPIER_ID = 7;
const COPIER_ACTION_TYPE = 3;
const LABELMAKER_ACTION_TYPE = 4;
const COPYING_MODE = 2;

type PrefabBlueprintDefinition = {
  shape: number[][];
  cellIds: number[][];
};

type PrefabBlueprintData = {
  __prefabulatorBlueprint?: {
    definition?: PrefabBlueprintDefinition;
  };
};

export function localizeLabelStructures(
  structures: SandustryBlueprintRecord[],
): SandustryBlueprintRecord[] {
  const localized = sandkit.api.blueprints.localizeStructures(structures);

  // Keep the definition on the transient Copier cursor after localization.
  // This does not call the clipboard API or save a blueprint.
  return structures.flatMap((structure) => {
    const definition = (structure.data as PrefabBlueprintData | undefined)?.__prefabulatorBlueprint
      ?.definition;
    const records = localized.filter(
      (record) => record.x === structure.x && record.y === structure.y,
    );
    if (!definition || !records.length) return records;
    return records.map((record) => ({
      ...record,
      data: { __prefabulatorBlueprint: { definition } },
    }));
  });
}

export function serializeLabelStructures(
  structures: SandustryBlueprintRecord[],
): SandustryBlueprintRecord[] {
  return sandkit.api.blueprints.serializeStructures(structures);
}

export function activateCopierPlacement(structures: SandustryBlueprintRecord[]): boolean {
  const api = sandkit.api;
  if (!api.action || !structures.length) return false;

  const minX = Math.min(...structures.map((structure) => structure.x));
  const maxX = Math.max(...structures.map((structure) => structure.x));
  const minY = Math.min(...structures.map((structure) => structure.y));
  const maxY = Math.max(...structures.map((structure) => structure.y));
  api.action.setCustomData({
    __labelmakerCursor: true,
    selectedStructures: structures,
    signalLinks: null,
    mode: COPYING_MODE,
    marqueeSelected: true,
    mouseOffset: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  });

  const state = sandkit.engine.state;
  if (state?.store?.player) {
    state.store.player.action = { type: COPIER_ACTION_TYPE, id: COPIER_ID };
    state.store.player.hotbar.activeSlotIndex = null;
  }
  api.input.resetMouseState();
  return true;
}

export function clearNativePlacementCursor(): void {
  sandkit.api.action?.setCustomData(null);
}

export function restoreLabelmakerAction(itemId: string, state?: SandustryEngineState): void {
  const playerState = state ?? sandkit.engine.state;
  if (playerState?.store?.player) {
    playerState.store.player.action = { type: LABELMAKER_ACTION_TYPE, id: itemId };
    playerState.store.player.hotbar.activeSlotIndex = null;
  }
}

export function isCopierAction(state: SandustryEngineState): boolean {
  return state?.store?.player?.action?.id === COPIER_ID;
}

export function isCopierSelected(selectedId: unknown): boolean {
  return String(selectedId) === String(COPIER_ID);
}

export function inventoryContains(itemId: string): boolean {
  return sandkit.engine.state.store.player.inventory.some((item) => item.id === itemId);
}
