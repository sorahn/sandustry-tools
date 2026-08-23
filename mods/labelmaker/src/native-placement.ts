/**
 * Compatibility boundary for Sandustry's internal Copier/prefabulator APIs.
 * Keep bundle-dependent state shapes and numeric action IDs in this file so
 * future runtime changes do not spread through the Labelmaker flow.
 */

export const COPIER_ID = 7;
const COPIER_ACTION_TYPE = 3;
const LABELMAKER_ACTION_TYPE = 4;
const COPYING_MODE = 2;

export function localizeLabelStructures(structures: readonly unknown[]): any[] {
  const localizer = (sandkit.engine.api as any).prefabulator?.localizeBlueprintStructures;
  return localizer ? structures.flatMap((structure) => localizer([structure])) : [...structures];
}

export function activateCopierPlacement(structures: readonly unknown[]): boolean {
  const api = sandkit.api as any;
  if (!api.action || !structures.length) return false;

  const minX = Math.min(...structures.map((structure: any) => structure.x));
  const maxX = Math.max(...structures.map((structure: any) => structure.x));
  const minY = Math.min(...structures.map((structure: any) => structure.y));
  const maxY = Math.max(...structures.map((structure: any) => structure.y));
  api.action.setCustomData({
    selectedStructures: structures,
    signalLinks: null,
    mode: COPYING_MODE,
    marqueeSelected: true,
    mouseOffset: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  });

  const state = sandkit.engine?.state as any;
  if (state?.store?.player) {
    state.store.player.action = { type: COPIER_ACTION_TYPE, id: COPIER_ID };
    state.store.player.hotbar.activeSlotIndex = null;
  }
  api.input.resetMouseState();
  return true;
}

export function clearNativePlacementCursor(): void {
  (sandkit.api as any).action?.setCustomData(null);
}

export function restoreLabelmakerAction(itemId: string, state?: any): void {
  const playerState = state ?? (sandkit.engine?.state as any);
  if (playerState?.store?.player) {
    playerState.store.player.action = { type: LABELMAKER_ACTION_TYPE, id: itemId };
    playerState.store.player.hotbar.activeSlotIndex = null;
  }
}

export function isCopierAction(state: any): boolean {
  return state?.store?.player?.action?.id === COPIER_ID;
}

export function isCopierSelected(selectedId: unknown): boolean {
  return String(selectedId) === String(COPIER_ID);
}

export function inventoryContains(itemId: string): boolean {
  const inventory = (sandkit.engine?.state as any)?.store?.player?.inventory;
  return Array.isArray(inventory) && inventory.some((item: any) => item?.id === itemId);
}
