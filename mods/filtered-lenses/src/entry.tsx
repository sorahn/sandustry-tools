/* Filtered Lenses: a native laser upgrade with a terrain whitelist picker. */

"use strict";

import { onDispose } from "~shared/dev-hmr";
import noop from "~shared/noop";
import { deserializeSelection, isNoFilter, serializeSelection } from "./terrainCatalog";
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
  "mods|filteredLenses|configurePrompt":
    "Enter terrain IDs to mine, separated by commas (for example: stone, dirt).",
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

const hslToHex = (h: number, s: number, l: number): string => {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getTerrainColor = (def: any): string | null => {
  if (!def || typeof def !== "object") return null;
  if (typeof def.metaColor === "number" && Number.isFinite(def.metaColor) && def.metaColor >= 0) {
    return "#" + (def.metaColor & 0xffffff).toString(16).padStart(6, "0");
  }
  if (Array.isArray(def.colorHSL) && def.colorHSL.length === 3) {
    const [h, s, l] = def.colorHSL;
    if (typeof h === "number" && typeof s === "number" && typeof l === "number") {
      return hslToHex(h, s, l);
    }
  }
  return null;
};

const entries = (): TerrainEntry[] =>
  safe(() => {
    const discovered: TerrainEntry[] = [];
    const seenTypes = new Set<number>();

    const checkType = (type: number) => {
      if (seenTypes.has(type)) return;
      seenTypes.add(type);
      try {
        const def = api.terrains.getDefinitionByType(type);
        if (!def) return;
        const color = getTerrainColor(def);
        if (!color) return;
        const id = api.terrains.getIdByType(type);
        if (!id) return;
        const name = def.nameKey ? api.i18n.getName({ nameKey: def.nameKey }) : def.name;
        if (!name) return;
        discovered.push({ id, type, name, color });
      } catch {
        // ignore unresolvable terrain
      }
    };

    for (let type = 1; type < 256; type++) {
      checkType(type);
    }

    const modTerrains = (sandkit as any).state?.sandkit?.mods?.terrains;
    if (modTerrains && typeof modTerrains === "object") {
      for (const key in modTerrains) {
        const cellType = modTerrains[key]?.cellType;
        if (typeof cellType === "number") {
          checkType(cellType);
        }
      }
    }

    return discovered.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

const currentSelection = (): TerrainSelection => {
  const saved = api.storage.local.get(FILTER_STORAGE_KEY) as string | undefined;
  return deserializeSelection(saved, entries());
};
const closePicker = (selection: TerrainSelection | null) => {
  if (!pickerState) return;
  const resolve = pickerState.resolve;
  const current = selection || pickerState.current;
  if (selection) api.storage.local.set(FILTER_STORAGE_KEY, serializeSelection(selection));
  pickerState = { current, minimized: true, resolve: null };
  pickerPromise = null;
  resolve?.(selection);
  refreshPicker();
};
const updateSelection = (selection: TerrainSelection) => {
  if (!pickerState) return;
  pickerState = { ...pickerState, current: selection };
  api.storage.local.set(FILTER_STORAGE_KEY, serializeSelection(selection));
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
    onUpdate={updateSelection}
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
  return deserializeSelection(`terrain:${entered.trim()}`, entries());
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
  api.storage.local.set(FILTER_STORAGE_KEY, serializeSelection(selection));
  const label = isNoFilter(selection)
    ? "[No filter]"
    : selection.entries.map((e) => e.name).join(", ");
  api.ui.toast(TEXT["mods|filteredLenses|configured"].replace("{terrain}", label));
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

const LASER_PATTERN_SIZE = 7;
let laserFilterInstalled = false;

const terrainMatchesSelection = (selected: TerrainSelection, terrainType: number | null) => {
  if (terrainType === null) return false;
  if (isNoFilter(selected)) return true;
  return selected.types.includes(terrainType);
};

const installLaserFilter = () => {
  if (laserFilterInstalled) return;
  const intercept = api.hooks?.intercept;
  if (typeof intercept !== "function") return;

  const unsubscribeIntercept = intercept(
    "item:use",
    (args: any) => {
      try {
        if (!isEnabled() || !hasFilteredLenses()) return false;
        if (args?.itemId !== LASER_ID || isNoFilter(currentSelection())) return false;
        const prepared = args?.prepared;
        if (prepared) {
          prepared.excavationPower = 0;
        }
      } catch (error) {
        console.error(`[${MOD_ID}] filtered laser item:use failed:`, error);
      }
      return false;
    },
    { itemIds: [LASER_ID], priority: 1000 },
  );

  const unsubscribeEvent = api.events?.on?.("item:used", (payload: any) => {
    try {
      if (!isEnabled() || !hasFilteredLenses()) return;
      if (payload?.itemId !== LASER_ID) return;
      const selected = currentSelection();
      if (isNoFilter(selected)) return;

      const targetX = payload.cellX;
      const targetY = payload.cellY;
      if (typeof targetX !== "number" || typeof targetY !== "number") return;

      const prepared = payload.prepared || {};
      const patternSize =
        typeof prepared.patternSize === "number" && prepared.patternSize > 0
          ? Math.floor(prepared.patternSize)
          : LASER_PATTERN_SIZE;
      const pattern = api.patterns.createCircle(patternSize);
      const radius = Math.floor(pattern.length / 2);

      const player = (sandkit as any).state?.store?.player;
      const mouse = (sandkit as any).state?.session?.input?.mouse?.worldPosition;
      const angle =
        player && mouse
          ? Math.atan2(
              mouse.y - (player.y + player.height / 2 + 2),
              mouse.x - (player.x + player.width / 2),
            )
          : 0;
      const ejectionSpeed =
        typeof prepared.debrisEjectionSpeedPixelsPerSecond === "number"
          ? prepared.debrisEjectionSpeedPixelsPerSecond
          : 300;
      const outVelocity = {
        x: ejectionSpeed * Math.cos(angle),
        y: ejectionSpeed * -Math.sin(angle),
      };

      for (let row = 0; row < pattern.length; row += 1) {
        for (let column = 0; column < pattern[row].length; column += 1) {
          if (pattern[row][column] === 0) continue;
          const cellX = targetX + column - radius;
          const cellY = targetY + row - radius;
          api.world.revealFogAtCell(cellX, cellY);
          const terrainType = api.terrains.getTypeAtCell(cellX, cellY);
          if (!terrainMatchesSelection(selected, terrainType)) continue;
          api.world.excavateAtCell(cellX, cellY, outVelocity, 1, { fromDrill: true });
        }
      }
      api.world.redrawAroundCellWhenIdle(targetX, targetY, pattern.length);
    } catch (error) {
      console.error(`[${MOD_ID}] filtered laser excavation failed:`, error);
    }
  });

  onDispose(() => {
    (unsubscribeIntercept as any)?.();
    (unsubscribeEvent as any)?.();
  });
  laserFilterInstalled = true;
};

installLaserFilter();
api.events.on("game:ready", installLaserFilter);
api.triggers.register(`${MOD_ID}:picker`, {
  interval: 100,
  callback: () => {
    syncPickerToSelectedAction();
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
