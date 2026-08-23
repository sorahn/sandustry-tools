/* Filtered Lenses: a native laser upgrade with a terrain whitelist picker. */

"use strict";

import { onDispose } from "~shared/dev-hmr";
import noop from "~shared/noop";
import {
  BLACKLISTED_TERRAIN_IDS,
  EARTH_FILTER_ENTRY,
  EARTH_FILTER_ID,
  EARTH_FILTER_TERRAIN_IDS,
  NO_FILTER_ENTRY,
  NO_FILTER_ID,
  TERRAIN_COLORS,
  TERRAIN_IDS,
} from "./terrainCatalog";
import { TerrainPicker } from "./ui/picker/TerrainPicker";
import type { PickerState, TerrainEntry, TerrainSelection } from "./ui/picker/pickerTypes";

const api = sandkit.api;
const MOD_ID = "sorahn.sandustry-filtered-lenses";
const LASER_ID = "laser";
const UPGRADE_ID = "filteredLenses";
const FILTER_STORAGE_KEY = `${MOD_ID}.element`;
const CONFIGURE_BINDING_ID = `${MOD_ID}:configure`;
const PICKER_ID = `${MOD_ID}-terrain-picker`;
const NAV_SCOPE = `${PICKER_ID}-scope`;
const UIReact = sandkit.react ?? null;
const HOTBAR_OVERLAY_SLOT = "hotbar";

const TEXT: Record<string, string> = {
  "upgrades|laser|filteredLenses|name": "Filtered Lenses",
  "upgrades|laser|filteredLenses|description":
    "Mine only the selected terrain. Press L while the laser is selected to change the filter.",
  "mods|filteredLenses|configurePrompt": "Enter a terrain ID to mine (for example: stone).",
  "mods|filteredLenses|configured": "Laser filter set to {terrain}.",
  "mods|filteredLenses|notPurchased": "Purchase Filtered Lenses before configuring the laser.",
  "mods|filteredLenses|cannotUseHere": "You cannot use the laser here.",
  "Filtered Lenses enabled": "Filtered Lenses enabled",
  "Allow the Filtered Lenses upgrade to affect the laser.":
    "Allow the Filtered Lenses upgrade to affect the laser.",
};

let pickerState: PickerState | null = null;
let pickerPromise: Promise<TerrainSelection | null> | null = null;
let pickerRepaint: ((update: (value: number) => number) => void) | null = null;
let pickerOverlayReady = false;

const refreshPicker = () => {
  pickerRepaint?.((value) => value + 1);
  try {
    api.ui.overlays.update(HOTBAR_OVERLAY_SLOT);
  } catch (error) {
    noop(error);
  }
};

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch (error) {
    console.error(`[${MOD_ID}] picker operation failed:`, error);
    return fallback;
  }
};
const isEnabled = () => {
  const value = api.settings.get("enabled");
  return typeof value === "boolean" ? value : true;
};
const hasFilteredLenses = () =>
  safe(() => api.upgrades.getLevelById(LASER_ID, UPGRADE_ID) >= 1, false);
const terrainTypeFromId = (id: string): number | null => {
  try {
    const runtimeId = id === "frostbed" ? "freezingIceSoil" : id;
    return api.terrains.getTypeFromId(runtimeId);
  } catch {
    return null;
  }
};
const entries = (): TerrainEntry[] =>
  safe(
    () =>
      TERRAIN_IDS.map((id) => {
        if (BLACKLISTED_TERRAIN_IDS.has(id)) return null;
        const type = terrainTypeFromId(id);
        if (type === null) return null;
        const name = safe(() => api.i18n.getName({ nameKey: `terrains|${id}|name` }), id);
        return { id, type, name: name || id, color: TERRAIN_COLORS[id] || "#8f9aa6" };
      })
        .filter((entry): entry is TerrainEntry => entry !== null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
const currentSelection = (): TerrainSelection => {
  const saved = api.storage.local.get(FILTER_STORAGE_KEY);
  if (typeof saved === "string" && saved.length > 0) {
    const id = saved.startsWith("terrain:") ? saved.slice(8) : saved;
    if (id === NO_FILTER_ID) return NO_FILTER_ENTRY;
    if (id === EARTH_FILTER_ID) return EARTH_FILTER_ENTRY;
    const type = terrainTypeFromId(id);
    if (type !== null && !BLACKLISTED_TERRAIN_IDS.has(id)) return { id, type };
  }
  return NO_FILTER_ENTRY;
};
const closePicker = (selection: TerrainSelection | null) => {
  if (!pickerState) return;
  const resolve = pickerState.resolve;
  const current = selection || pickerState.current;
  if (selection) api.storage.local.set(FILTER_STORAGE_KEY, `terrain:${selection.id}`);
  pickerState = { current, minimized: true, resolve: null };
  pickerPromise = null;
  resolve?.(selection);
  refreshPicker();
};
const minimizePicker = () => {
  if (pickerState && !pickerState.minimized) {
    const resolve = pickerState.resolve;
    pickerState = { ...pickerState, minimized: true, resolve: null };
    pickerPromise = null;
    resolve?.(null);
    refreshPicker();
  }
};

const registerPickerRepaint = (repaint: (update: (value: number) => number) => void) => {
  pickerRepaint = repaint;
  return () => {
    if (pickerRepaint === repaint) pickerRepaint = null;
  };
};

const renderTerrainPicker = () => (
  <TerrainPicker
    picker={pickerState}
    entries={entries()}
    pickerId={PICKER_ID}
    scope={NAV_SCOPE}
    onOpen={(current) => void openTerrainPicker(current)}
    onClose={closePicker}
    onMinimize={minimizePicker}
    onRegisterRepaint={registerPickerRepaint}
  />
);

const PickerFallbackHost = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[10000] flex items-end justify-center px-4"
    style={{ paddingBottom: "clamp(72px, 10vh, 96px)" }}
  >
    {renderTerrainPicker()}
  </div>
);

const registerPicker = () => {
  if (pickerOverlayReady) return true;
  if (!UIReact) return false;
  try {
    api.ui.overlays.register(HOTBAR_OVERLAY_SLOT, PICKER_ID, renderTerrainPicker);
    pickerOverlayReady = true;
    onDispose(() => {
      try {
        api.ui.overlays.unregister(HOTBAR_OVERLAY_SLOT, PICKER_ID);
      } catch (error) {
        noop(error);
      }
    });
    return pickerOverlayReady;
  } catch (error) {
    console.warn(`[${MOD_ID}] hotbar picker host unavailable; using injected fallback:`, error);
  }
  try {
    const dispose = api.ui.inject(PICKER_ID, PickerFallbackHost);
    pickerOverlayReady = typeof dispose === "function";
    if (pickerOverlayReady) onDispose(dispose as () => void);
    return pickerOverlayReady;
  } catch (error) {
    console.error(`[${MOD_ID}] terrain picker unavailable:`, error);
    return false;
  }
};
const openTerrainPicker = async (current: TerrainSelection) => {
  if (!isEnabled() || !hasFilteredLenses()) return null;
  if (registerPicker()) {
    if (pickerPromise) return pickerPromise;
    pickerPromise = new Promise((resolve) => {
      pickerState = { current, minimized: false, resolve };
      refreshPicker();
    });
    return pickerPromise;
  }
  const entered = await api.ui.prompt(TEXT["mods|filteredLenses|configurePrompt"]);
  if (!entered?.trim()) return null;
  const id = entered.trim();
  if (id === NO_FILTER_ID) return NO_FILTER_ENTRY;
  if (id === EARTH_FILTER_ID) return EARTH_FILTER_ENTRY;
  const type = terrainTypeFromId(id);
  return type === null ? null : { id, type };
};
const syncPickerToSelectedAction = () => {
  if (!UIReact) return;
  const selected = safe(() => api.action?.getSelected(), null);
  const canConfigure = isEnabled() && hasFilteredLenses();
  if (selected?.id === LASER_ID && canConfigure && !pickerState) {
    if (!registerPicker()) return;
    pickerState = { current: currentSelection(), minimized: true, resolve: null };
    refreshPicker();
    return;
  }
  if ((selected?.id !== LASER_ID || !canConfigure) && pickerState) {
    const resolve = pickerState.resolve;
    pickerState = null;
    pickerPromise = null;
    resolve?.(null);
    refreshPicker();
  }
};
const configure = async () => {
  if (!isEnabled()) return;
  if (api.upgrades.getLevelById(LASER_ID, UPGRADE_ID) < 1) {
    api.ui.toast(TEXT["mods|filteredLenses|notPurchased"]);
    return;
  }
  const selection = await openTerrainPicker(currentSelection());
  if (!selection) return;
  api.storage.local.set(FILTER_STORAGE_KEY, `terrain:${selection.id}`);
  api.ui.toast(TEXT["mods|filteredLenses|configured"].replace("{terrain}", selection.id));
};

api.i18n.register("en", TEXT);
api.upgrades.register({
  itemId: LASER_ID,
  itemNameKey: "items|laser|name",
  categoryId: "tools",
  upgrade: {
    id: UPGRADE_ID,
    nameKey: "upgrades|laser|filteredLenses|name",
    descriptionKey: "upgrades|laser|filteredLenses|description",
    maxLevel: 1,
    costs: [5000],
    oneOff: true,
  },
});

const laserTargetCell = (state: any) => {
  const player = state?.store?.player;
  const mouse = state?.session?.input?.mouse?.worldPosition;
  if (!player || !mouse) return null;
  const startX = player.x + player.width / 2;
  const startY = player.y + player.height / 2 + 2;
  const angle = Math.atan2(mouse.y - startY, mouse.x - startX);
  return api.raycast.castFromWorld(startX, startY, angle, LASER_RANGE);
};

let laserBeam: any = null;
let laserChargeStart = 0;
const LASER_ENERGY_COST = 60;
const LASER_RANGE = 1000;
const LASER_CHARGE_MS = 1000;
const LASER_PATTERN_SIZE = 7;
const LASER_COLOR = 0xff0000;
const DEBUG_LASER = false;
let laserCharged = false;
let laserSessionActive = false;
let laserDebugLastLog = 0;

const debugLaser = (
  state: any,
  message: string,
  details: Record<string, unknown> = {},
  force = false,
) => {
  if (!DEBUG_LASER) return;
  const now = Number(state?.store?.meta?.time) || Date.now();
  if (!force && now - laserDebugLastLog < 250) return;
  laserDebugLastLog = now;
  console.log(
    `[${MOD_ID}] ${message} ${JSON.stringify({
      active: Boolean(state?.session?.action?.state?.[2]),
      mousePressed: Boolean(state?.session?.input?.mouse?.pressed),
      mouseReleased: Boolean(state?.session?.input?.mouse?.released),
      start: Boolean(state?.session?.action?.state?.[1]),
      end: Boolean(state?.session?.action?.state?.[3]),
      beam: Boolean(laserBeam),
      chargeStart: laserChargeStart,
      charged: laserCharged,
      ...details,
    })}`,
  );
};

const clearLaser = () => {
  laserBeam?.destroy?.();
  laserBeam = null;
  laserChargeStart = 0;
  laserCharged = false;
  laserSessionActive = false;
};

const terrainMatchesSelection = (selected: TerrainSelection, terrainType: number | null) => {
  if (terrainType === null) return false;
  if (selected.id === EARTH_FILTER_ID) {
    return EARTH_FILTER_TERRAIN_IDS.some((id) => terrainTypeFromId(id) === terrainType);
  }
  return terrainType === selected.type;
};

const runFilteredLaser = (state: any) => {
  const player = state?.store?.player;
  const mouse = state?.session?.input?.mouse?.worldPosition;
  const actionState = state?.session?.action?.state;
  const active = Boolean(actionState?.[2]);
  const ending = Boolean(actionState?.[3]);
  if (active) laserSessionActive = true;
  const held = Boolean(
    active || state?.session?.input?.mouse?.pressed || (laserSessionActive && !ending),
  );
  if (!player || !mouse || !held) {
    debugLaser(state, "filtered laser inactive; clearing");
    clearLaser();
    return;
  }

  const now = Number(state?.store?.meta?.time) || Date.now();
  if (!laserChargeStart || actionState[1]) {
    if (api.authorization?.canUseTool && !api.authorization.canUseTool(player)) {
      api.ui.toast(TEXT["mods|filteredLenses|cannotUseHere"]);
      clearLaser();
      return;
    }
    laserChargeStart = now;
    laserCharged = false;
    api.sound?.play?.("charge_up", { offset: 1.5, volume: 0.2, fadeIn: 1.5 });
    api.sound?.play?.("charge_up_2", { maxDuration: 0.95, volume: 0.1 });
    api.sound?.play?.("charge_up_3", {
      maxDuration: 1,
      offset: 0.5 + Math.random() * 1.5,
      volume: 0.05,
      fadeIn: 1,
    });
  }
  const startX = player.x + player.width / 2;
  const startY = player.y + player.height / 2 + 2;
  const angle = Math.atan2(mouse.y - startY, mouse.x - startX);
  const target = laserTargetCell(state);
  if (!target && !laserCharged) laserChargeStart = now;
  const charge = Math.min((now - laserChargeStart) / LASER_CHARGE_MS, 1);
  const metrics = api.rendering.getGridMetrics();
  const camera = state?.session?.camera || { x: 0, y: 0 };
  const endX = target
    ? target.x * metrics.cellSize + metrics.cellSize / 2
    : startX + Math.cos(angle) * LASER_RANGE;
  const endY = target
    ? target.y * metrics.cellSize + metrics.cellSize / 2
    : startY + Math.sin(angle) * LASER_RANGE;

  laserBeam?.destroy?.();
  laserBeam = api.effects.createLaserAtWorld(
    startX - camera.x,
    startY - camera.y,
    endX - camera.x,
    endY - camera.y,
    {
      width: charge < 1 ? 1 + 2 * charge : 3,
      brightness: charge < 1 ? 0.1 + 0.4 * charge : 1,
      color: LASER_COLOR,
      glow: true,
    },
  );
  api.effects.createLightAtWorld(startX, startY, {
    brightness: 0.8 * (charge < 1 ? 0.1 + 0.4 * charge : 1),
    duration: 1,
    size: 300,
    color: [1, 0, 0, 1],
    dedupKey: "laser:origin",
  });
  debugLaser(state, "filtered laser frame", {
    now,
    charge,
    target: target ? { x: target.x, y: target.y, distance: target.distance } : null,
    startWorld: { x: startX, y: startY },
    endWorld: { x: endX, y: endY },
    camera: { x: camera.x, y: camera.y },
    beamType: laserBeam?.constructor?.name || typeof laserBeam,
    beamCanDestroy: typeof laserBeam?.destroy === "function",
  });

  if (charge >= 1 && target) {
    const firstChargedExcavation = !laserCharged;
    laserCharged = true;
    debugLaser(
      state,
      firstChargedExcavation ? "filtered laser excavation begin" : "filtered laser excavation tick",
      { target: { x: target.x, y: target.y } },
      firstChargedExcavation,
    );
    if (firstChargedExcavation) {
      for (let flash = 0; flash < 3; flash += 1) {
        setTimeout(() => {
          api.effects.createLightAtWorld(target.x * metrics.cellSize, target.y * metrics.cellSize, {
            brightness: 0.5,
            duration: 100,
            size: 300,
            color: [1, 0, 0, 1],
            unclamped: true,
            skipDedup: true,
          });
        }, 100 * flash);
      }
    }
    if (api.energy.consume(LASER_ENERGY_COST, { allOrNothing: true }) !== LASER_ENERGY_COST) {
      api.ui.toast("Not enough energy.");
      api.sound?.play?.("ammo_empty", {
        rateLimitKey: "laser_no_energy",
        rateLimitMs: 1000,
        volume: 0.15,
      });
      debugLaser(state, "filtered laser shot denied", {}, true);
      return;
    }
    const selected = currentSelection();
    const pattern = api.patterns.createCircle(LASER_PATTERN_SIZE);
    const radius = Math.floor(pattern.length / 2);
    const outVelocity = { x: 300 * Math.cos(angle), y: 300 * -Math.sin(angle) };
    const matchingCells: Array<{ x: number; y: number; type: number | null }> = [];
    for (let row = 0; row < pattern.length; row += 1) {
      for (let column = 0; column < pattern[row].length; column += 1) {
        if (pattern[row][column] === 0) continue;
        const cellX = target.x + column - radius;
        const cellY = target.y + row - radius;
        api.world.revealFogAtCell(cellX, cellY);
        const terrainType = api.terrains.getTypeAtCell(cellX, cellY);
        if (!terrainMatchesSelection(selected, terrainType)) continue;
        matchingCells.push({ x: cellX, y: cellY, type: terrainType });
        api.world.excavateAtCell(cellX, cellY, outVelocity, 1, { fromDrill: true });
      }
    }
    api.world.redrawAroundCellWhenIdle(target.x, target.y, pattern.length);
    if (firstChargedExcavation) {
      debugLaser(
        state,
        "filtered laser excavation cells",
        { selected: { id: selected.id, type: selected.type }, matchingCells },
        true,
      );
    }
    api.effects.createLightAtWorld(target.x * metrics.cellSize, target.y * metrics.cellSize, {
      brightness: 1,
      duration: 300,
      size: 300,
      color: [1, 0, 0, 1],
      dedupKey: "filtered-laser:impact",
    });
    api.effects.createParticlesAtWorld(target.x * metrics.cellSize, target.y * metrics.cellSize, {
      count: 8,
      minSpeed: 100,
      maxSpeed: 200,
      color: LASER_COLOR,
      minSize: 1,
      maxSize: 2,
      minLifetime: 0.2,
      maxLifetime: 0.4,
    });
    api.sound?.play?.("laser_hit", {
      playbackRate: 0.1 + Math.random() * 1.4,
      volume: 0.02,
      maxInstances: 96,
    });
    debugLaser(state, "filtered laser excavation tick end", {}, firstChargedExcavation);
  }
};

let laserFilterInstalled = false;
const installLaserFilter = () => {
  if (laserFilterInstalled) return;
  const definition = api.items.getDefinitionById(LASER_ID);
  const originalHandleAction = definition?.handleAction;
  const originalAfterRender = definition?.afterRender;
  if (!definition || typeof originalHandleAction !== "function") {
    console.warn(`[${MOD_ID}] native laser definition was not available`);
    return;
  }

  api.items.updateDefinition(LASER_ID, {
    handleAction: (state: any, action: any) => {
      if (!isEnabled() || api.upgrades.getLevelById(LASER_ID, UPGRADE_ID) < 1) {
        return originalHandleAction(state, action);
      }
      if (currentSelection().id === NO_FILTER_ID) {
        clearLaser();
        return originalHandleAction(state, action);
      }
      try {
        runFilteredLaser(state);
        return;
      } catch (error) {
        console.error(`[${MOD_ID}] filtered laser action failed; using native laser:`, error);
        clearLaser();
        return originalHandleAction(state, action);
      }
    },
    afterRender: (state: any) => {
      if (
        isEnabled() &&
        api.upgrades.getLevelById(LASER_ID, UPGRADE_ID) >= 1 &&
        currentSelection().id !== NO_FILTER_ID
      ) {
        const actionState = state?.session?.action?.state;
        if (
          actionState?.[2] ||
          state?.session?.input?.mouse?.pressed ||
          (laserSessionActive && !actionState?.[3])
        )
          return;
        debugLaser(state, "afterRender clearing inactive laser");
        clearLaser();
        return;
      }
      originalAfterRender?.(state);
    },
  });
  laserFilterInstalled = true;
};

installLaserFilter();
api.events.on("game:ready", installLaserFilter);
setTimeout(installLaserFilter, 1000);
api.triggers.register(`${MOD_ID}:picker`, {
  interval: 100,
  callback: () => {
    syncPickerToSelectedAction();
    if (api.action?.getSelected?.()?.id !== LASER_ID) clearLaser();
  },
});
syncPickerToSelectedAction();
api.input.registerBinding(CONFIGURE_BINDING_ID, ["KeyL"], {
  displayName: "Configure Filtered Lenses",
  category: "Filtered Lenses",
  handlers: {
    down: () => {
      if (api.action?.getSelected?.()?.id === LASER_ID) void configure();
    },
  },
});
