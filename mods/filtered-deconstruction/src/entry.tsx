/* Filtered Deconstruction: a native-backed structure removal tool with multi-select whitelist. */

"use strict";

import { onDispose } from "~shared/dev-hmr";
import noop from "~shared/noop";
import {
  deserializeSelection,
  getCategoryColor,
  isNoFilter,
  serializeSelection,
} from "./structureCatalog";
import { StructurePicker } from "./ui/picker/StructurePicker";
import type { PickerState, StructureEntry, StructureSelection } from "./ui/picker/pickerTypes";

const api = sandkit.api;
const engine = sandkit.engine;

const MOD_ID = "sorahn.sandustry-filtered-deconstruction";
const ITEM_ID = "filteredDeconstruction";
const ITEM_SPRITE_ID = "filteredDeconstructionSprite";
const ACTION_START = 1;
const ACTION_ACTIVE = 2;
const ACTION_END = 3;
const TOOL_ITEM_TYPE = 2;
const FILTER_STORAGE_KEY = `${MOD_ID}.filter`;
const CONFIGURE_BINDING_ID = `${MOD_ID}:configure`;
const PICKER_ID = `${MOD_ID}-structure-picker`;
const NAV_SCOPE = `${PICKER_ID}-scope`;
const UIReact = sandkit.react ?? null;
const HOTBAR_OVERLAY_SLOT = "hotbar";

const TEXT = {
  "items|filteredDeconstruction|name": "Filtered Deconstruction",
  "items|filteredDeconstruction|description":
    "Deconstruct structures with a whitelist filter. Drag to select an area. Press F to change the filter.",
  "mods|filteredDeconstruction|configurePrompt":
    "Enter structure IDs to deconstruct, separated by commas (or leave blank for all).",
};

type Point = { x: number; y: number };
type DragData = {
  start: Point;
  end: Point;
};

type InternalRenderingApi = {
  getCellDrawPos(state: SandustryEngineState, x: number, y: number): Point;
  getGridMetrics(): { cellSize: number; snapGridCellSize: number };
  withOverlayContext(
    state: SandustryEngineState,
    callback: (context: CanvasRenderingContext2D) => void,
  ): void;
};

type InternalStructuresApi = {
  removeAtPositions?: (
    state: SandustryEngineState,
    positions: Point[],
    options?: Record<string, unknown>,
  ) => void;
};

type InternalEngineApi = {
  rendering?: InternalRenderingApi;
  structures?: InternalStructuresApi;
};

const internalApi = engine.api as unknown as InternalEngineApi;

let pickerState: PickerState | null = null;
let pickerPromise: Promise<StructureSelection | null> | null = null;
let pickerRepaint: ((update: (value: number) => number) => void) | null = null;
let pickerOverlayReady = false;

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch (error) {
    console.error(`[${MOD_ID}] operation failed:`, error);
    return fallback;
  }
};

const asPoint = (value: unknown): Point | null => {
  if (!value || typeof value !== "object") return null;
  const point = value as Partial<Point>;
  return Number.isFinite(point.x) && Number.isFinite(point.y)
    ? { x: Number(point.x), y: Number(point.y) }
    : null;
};

const mouseCell = (state: SandustryEngineState): Point | null => {
  const input = state.session.input as { mouse?: { cellPosition?: Point } } | undefined;
  const mouse = input?.mouse;
  return asPoint(mouse?.cellPosition);
};

const currentDrag = (state: SandustryEngineState): DragData | null => {
  const data = state.session.action?.customData;
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<DragData>;
  const start = asPoint(candidate.start);
  const end = asPoint(candidate.end);
  return start && end ? { start, end } : null;
};

const setDrag = (state: SandustryEngineState, drag: DragData | null): void => {
  api.action?.setCustomData(drag ? { filteredDeconstruction: true, ...drag } : null);
};

const selectedTool = (): boolean => {
  try {
    return api.action?.getSelected?.()?.id === ITEM_ID;
  } catch {
    return false;
  }
};

const PREFAB_ENTRY_ID = "prefab";

const isPrefabIdentifier = (ref: unknown, defId?: unknown): boolean => {
  const refStr = String(ref ?? "").toLowerCase();
  const idStr = String(defId ?? "").toLowerCase();
  return refStr.startsWith("prefab") || idStr.startsWith("prefab");
};

const resolveTranslatedName = (def: any): string | null => {
  if (!def) return null;
  if (def.nameKey) {
    try {
      if ((api.i18n as any).hasTranslation?.(def.nameKey)) {
        const name = (api.i18n as any).getName({ nameKey: def.nameKey });
        if (name && !name.includes("|") && name !== "[NO KEY]" && name !== def.nameKey) {
          return name;
        }
      }
      const name = (api.i18n as any).getName({ nameKey: def.nameKey });
      if (name && !name.includes("|") && name !== "[NO KEY]" && name !== def.nameKey) {
        return name;
      }
    } catch {
      // fallback
    }
  }
  if (
    def.name &&
    typeof def.name === "string" &&
    !def.name.includes("|") &&
    !def.name.startsWith("[")
  ) {
    return def.name;
  }
  return null;
};

const entries = (): StructureEntry[] =>
  safe(() => {
    const entriesByName = new Map<string, StructureEntry>();
    let prefabEntry: StructureEntry | null = null;

    const processRef = (ref: number | string, def?: any) => {
      if (isPrefabIdentifier(ref, def?.id)) {
        if (!prefabEntry) {
          prefabEntry = {
            id: PREFAB_ENTRY_ID,
            type: "prefab",
            types: [ref],
            ids: def?.id ? [def.id] : [],
            name: "Prefab",
            categoryKey: "blocks",
            color: getCategoryColor("blocks"),
          };
        } else {
          if (!prefabEntry.types?.includes(ref)) prefabEntry.types?.push(ref);
          if (def?.id && !prefabEntry.ids?.includes(def.id)) prefabEntry.ids?.push(def.id);
        }
        return;
      }

      const name = resolveTranslatedName(def);
      if (!name) return;

      if (entriesByName.has(name)) {
        const existing = entriesByName.get(name)!;
        if (!existing.types?.includes(ref)) existing.types?.push(ref);
        if (def?.id && !existing.ids?.includes(def.id)) existing.ids?.push(def.id);
      } else {
        const id = def?.id || (typeof ref === "string" ? ref : String(ref));
        const categoryKey = def?.categoryKey || "general";
        entriesByName.set(name, {
          id,
          type: ref,
          types: [ref],
          ids: def?.id ? [def.id] : [id],
          name,
          categoryKey,
          color: getCategoryColor(categoryKey),
        });
      }
    };

    try {
      const available = api.structures.getAvailableTypes?.();
      if (available && typeof (available as any)[Symbol.iterator] === "function") {
        for (const ref of available) {
          const def = api.structures.getDefinitionByType?.(ref);
          processRef(ref, def);
        }
      }
    } catch (err) {
      noop(err);
    }

    try {
      const unlocked = api.structures.getUnlockedTypes?.();
      if (unlocked && typeof (unlocked as any)[Symbol.iterator] === "function") {
        for (const ref of unlocked) {
          const def = api.structures.getDefinitionByType?.(ref);
          processRef(ref, def);
        }
      }
    } catch (err) {
      noop(err);
    }

    try {
      const modStructures = (sandkit as any).state?.sandkit?.mods?.structures;
      if (modStructures && typeof modStructures === "object") {
        for (const id in modStructures) {
          const item = modStructures[id];
          const def = item?.definition || item;
          processRef(def?.type ?? id, def);
        }
      }
    } catch (err) {
      noop(err);
    }

    const knownIds = [
      "conveyor",
      "pipe",
      "pump",
      "inserter",
      "splitter",
      "undergroundConveyor",
      "undergroundPipe",
      "storage",
      "source",
      "trash",
      "thermalSource",
      "chill",
      "gate",
      "wall",
      "wire",
      "solarPanel",
      "battery",
      "furnace",
      "assembler",
      "refinery",
      "crusher",
      "boiler",
      "steamEngine",
      "miner",
      "beacon",
      "radar",
      "lamp",
      "signalButton",
      "label",
    ];
    for (const id of knownIds) {
      try {
        const type = api.structures.getTypeById?.(id);
        if (type !== undefined && type !== null) {
          const def = api.structures.getDefinitionByType?.(type);
          processRef(type, def);
        }
      } catch {
        // ignore unresolvable
      }
    }

    const discovered = Array.from(entriesByName.values());
    if (prefabEntry) discovered.push(prefabEntry);
    return discovered.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

const currentSelection = (): StructureSelection => {
  const saved = api.storage.local.get(FILTER_STORAGE_KEY) as string | undefined;
  return deserializeSelection(saved, entries());
};

const matchesFilter = (structure: any, selection: StructureSelection): boolean => {
  if (!structure) return false;
  if (isNoFilter(selection)) return true;

  const structType = structure.type;
  const structId = structure.id;
  const structTypeStr = String(structType ?? "").toLowerCase();
  const structIdStr = String(structId ?? "").toLowerCase();

  const isStructurePrefab =
    structTypeStr.startsWith("prefab") ||
    structIdStr.startsWith("prefab") ||
    Boolean(structure.data?.__prefabulatorBlueprint) ||
    Boolean(structure.data?.__prefabBlueprint);

  for (const entry of selection.entries) {
    if (entry.id === PREFAB_ENTRY_ID && isStructurePrefab) return true;
    if (entry.types?.includes(structType)) return true;
    if (structId && entry.ids?.includes(structId)) return true;
    if (entry.type !== -1 && entry.type === structType) return true;
    if (entry.id && entry.id === structId) return true;
    if (entry.id) {
      try {
        if ((api.structures as any).isType?.(structure, entry.id)) return true;
      } catch {
        // fallback
      }
    }
  }
  return false;
};

const refreshPicker = () => {
  pickerRepaint?.((value) => value + 1);
  try {
    api.ui.overlays.update(HOTBAR_OVERLAY_SLOT);
  } catch (error) {
    noop(error);
  }
};

const closePicker = (selection: StructureSelection | null) => {
  if (!pickerState) return;
  const resolve = pickerState.resolve;
  const current = selection || pickerState.current;
  if (selection) api.storage.local.set(FILTER_STORAGE_KEY, serializeSelection(selection));
  pickerState = { current, minimized: true, resolve: null };
  pickerPromise = null;
  resolve?.(selection);
  refreshPicker();
};

const updateSelection = (selection: StructureSelection) => {
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

const renderStructurePicker = () => (
  <StructurePicker
    picker={pickerState}
    entries={entries()}
    pickerId={PICKER_ID}
    scope={NAV_SCOPE}
    onOpen={(current) => void openStructurePicker(current)}
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
    {renderStructurePicker()}
  </div>
);

const registerPicker = () => {
  if (pickerOverlayReady) return true;
  if (!UIReact) return false;
  try {
    api.ui.overlays.register(HOTBAR_OVERLAY_SLOT, PICKER_ID, renderStructurePicker);
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
    console.error(`[${MOD_ID}] structure picker unavailable:`, error);
    return false;
  }
};

const openStructurePicker = async (current: StructureSelection) => {
  if (registerPicker()) {
    if (pickerPromise) return pickerPromise;
    pickerPromise = new Promise((resolve) => {
      pickerState = { current, minimized: false, resolve };
      refreshPicker();
    });
    return pickerPromise;
  }
  const entered = await api.ui.prompt(TEXT["mods|filteredDeconstruction|configurePrompt"]);
  if (!entered?.trim()) return null;
  return deserializeSelection(`structures:${entered.trim()}`, entries());
};

const syncPickerToSelectedAction = () => {
  if (!UIReact) return;
  const selected = safe(() => api.action?.getSelected(), null);
  const isTargetSelected = selected?.id === ITEM_ID;

  if (isTargetSelected && !pickerState) {
    if (!registerPicker()) return;
    pickerState = { current: currentSelection(), minimized: true, resolve: null };
    refreshPicker();
    return;
  }

  if (!isTargetSelected && pickerState) {
    const resolve = pickerState.resolve;
    pickerState = null;
    pickerPromise = null;
    resolve?.(null);
    refreshPicker();
  }
};

const removeAtPositions = (state: SandustryEngineState, positions: Point[]): void => {
  if (positions.length === 0) return;

  const publicRemoveMany = (
    api.structures as typeof api.structures & {
      removeAtCellsWhenIdle?: (positions: Point[], options?: Record<string, unknown>) => void;
    }
  ).removeAtCellsWhenIdle;
  if (typeof publicRemoveMany === "function") {
    publicRemoveMany(positions, {
      removeCells: true,
      playSound: true,
    });
    return;
  }

  const nativeRemove = internalApi.structures?.removeAtPositions;
  if (typeof nativeRemove === "function") {
    nativeRemove(state, positions, {
      removeCells: true,
      playSound: true,
    });
    return;
  }

  const publicRemove = (
    api.structures as typeof api.structures & {
      removeAtCellWhenIdle?: (x: number, y: number, options?: Record<string, unknown>) => void;
    }
  ).removeAtCellWhenIdle;
  if (typeof publicRemove !== "function") return;
  for (const position of positions) publicRemove(position.x, position.y, { removeCells: true });
};

const commitDrag = (state: SandustryEngineState, drag: DragData): void => {
  const minX = Math.min(drag.start.x, drag.end.x);
  const maxX = Math.max(drag.start.x, drag.end.x);
  const minY = Math.min(drag.start.y, drag.end.y);
  const maxY = Math.max(drag.start.y, drag.end.y);

  const activeFilter = pickerState?.current ?? currentSelection();
  const toRemove: Point[] = [];
  const seen = new Set<string>();

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const structure = api.structures.getAtCell(x, y);
      if (structure && matchesFilter(structure, activeFilter)) {
        const key = `${x},${y}`;
        if (!seen.has(key)) {
          seen.add(key);
          toRemove.push({ x, y });
        }
      }
    }
  }

  removeAtPositions(state, toRemove);
};

const drawPreview = (state: SandustryEngineState, drag: DragData): void => {
  const rendering = internalApi.rendering;
  if (!rendering?.withOverlayContext || !rendering.getCellDrawPos) return;

  const metrics = rendering.getGridMetrics();
  const cellSize = metrics.cellSize;

  const minX = Math.min(drag.start.x, drag.end.x);
  const maxX = Math.max(drag.start.x, drag.end.x);
  const minY = Math.min(drag.start.y, drag.end.y);
  const maxY = Math.max(drag.start.y, drag.end.y);

  const drawMin = rendering.getCellDrawPos(state, minX, minY);
  const drawMax = rendering.getCellDrawPos(state, maxX, maxY);

  const boxX = Math.min(drawMin.x, drawMax.x);
  const boxY = Math.min(drawMin.y, drawMax.y);
  const boxWidth = Math.abs(drawMax.x - drawMin.x) + cellSize;
  const boxHeight = Math.abs(drawMax.y - drawMin.y) + cellSize;

  const activeFilter = pickerState?.current ?? currentSelection();

  rendering.withOverlayContext(state, (context) => {
    context.save();

    // 1. Soft match all tiles inside the selection (subtle red wash)
    context.fillStyle = "rgba(240, 40, 40, 0.08)";
    context.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 2. Red rectangle around absolute location of the drag box
    context.strokeStyle = "rgba(245, 45, 45, 0.9)";
    context.lineWidth = 1.5;
    context.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth - 1, boxHeight - 1);

    // 3. Highlight the selected blocks that will be affected
    context.lineWidth = 1;
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const structure = api.structures.getAtCell(x, y);
        if (structure && matchesFilter(structure, activeFilter)) {
          const cellDraw = rendering.getCellDrawPos(state, x, y);
          context.fillStyle = "rgba(235, 40, 40, 0.4)";
          context.fillRect(cellDraw.x, cellDraw.y, cellSize, cellSize);
          context.strokeStyle = "#ffe700";
          context.strokeRect(cellDraw.x + 0.5, cellDraw.y + 0.5, cellSize - 1, cellSize - 1);
        }
      }
    }

    context.restore();
  });
};

const handleAction = (state: SandustryEngineState): void => {
  const actionState = state.session.action?.state;
  const cell = mouseCell(state);
  if (!cell) return;

  if (actionState?.[ACTION_START]) {
    setDrag(state, { start: cell, end: cell });
    return;
  }

  const drag = currentDrag(state);
  if (!drag) return;

  if (actionState?.[ACTION_ACTIVE]) {
    setDrag(state, { start: drag.start, end: cell });
    return;
  }

  if (actionState?.[ACTION_END]) {
    commitDrag(state, { start: drag.start, end: cell });
    setDrag(state, null);
  }
};

const registerItem = (): void => {
  const definition: SandustryItemDefinition = {
    id: ITEM_ID,
    itemType: TOOL_ITEM_TYPE,
    nameKey: "items|filteredDeconstruction|name",
    descriptionKey: "items|filteredDeconstruction|description",
    categoryKey: "utility",
    sprite: { id: ITEM_SPRITE_ID, type: "backhand" },
    handleAction,
    afterRender: (state) => {
      if (!selectedTool()) return;
      const drag = currentDrag(state);
      if (drag) drawPreview(state, drag);
    },
  };

  if (api.items.getDefinitionById(ITEM_ID)) {
    api.items.updateDefinition(ITEM_ID, definition);
  } else {
    api.items.register(definition);
  }

  api.input.registerBinding(`${MOD_ID}:cancel`, ["MouseRight"], {
    displayName: "Filtered Deconstruction Cancel",
    category: "utility",
    handlers: {
      down: () => {
        if (selectedTool()) api.action?.setCustomData(null);
      },
    },
  });

  api.input.registerBinding(CONFIGURE_BINDING_ID, ["KeyF"], {
    displayName: "Configure Deconstruction Filter",
    category: "utility",
    handlers: {
      down: () => {
        if (!selectedTool()) return;
        if (pickerState && !pickerState.minimized) {
          minimizePicker();
        } else {
          void openStructurePicker(currentSelection());
        }
      },
    },
  });

  api.events.on("action:changed", () => {
    if (!selectedTool()) api.action?.setCustomData(null);
    syncPickerToSelectedAction();
  });
};

const ensureSingleInventoryItem = (): void => {
  const state = engine.state as unknown as {
    store?: { player?: { inventory?: Array<{ id?: string | number }> } };
  };
  const inventory = state.store?.player?.inventory;
  if (!inventory) {
    if (!api.items.isActiveById?.(ITEM_ID)) api.player.inventory.addFromId(ITEM_ID);
    return;
  }

  let kept = false;
  for (let index = inventory.length - 1; index >= 0; index -= 1) {
    if (inventory[index]?.id !== ITEM_ID) continue;
    if (kept) inventory.splice(index, 1);
    else kept = true;
  }
  if (!kept) api.player.inventory.addFromId(ITEM_ID);
};

const initialize = async (): Promise<void> => {
  api.i18n.register("en", TEXT);
  await api.sprites.loadFromMod(ITEM_SPRITE_ID, "assets/filtered-deconstruction.png");
  registerItem();

  api.events.on("game:ready", () => {
    ensureSingleInventoryItem();
    syncPickerToSelectedAction();
  });
};

initialize().catch((error) => console.error(`[${MOD_ID}] initialization failed:`, error));
