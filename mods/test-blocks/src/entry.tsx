/*
 * Infinite Source and Trash
 *
 * Sandustry v1 entry scripts are plain scripts compiled with `sandkit` already
 * in scope. Do not add import/export statements.
 */

"use strict";

import noop from "~shared/noop";
import { onDispose } from "~shared/dev-hmr";
import { ElementRow } from "./ui/picker/ElementRow";
import { SearchInput } from "./ui/picker/SearchInput";
import { createElementCatalog } from "./ui/picker/elementCatalog";
import {
  findSelectedElement,
  filterElements,
  matterTabs,
  isSelectedElement,
} from "./ui/picker/pickerModel";
import { matterTabClass } from "./ui/picker/styles";
import type { PickerElement, PickerRuntimeState } from "./ui/picker/pickerTypes";

const api = sandkit.api;
const engine = sandkit.engine;
const MOD_ID = "sorahn.sandustry-test-blocks";

const SOURCE_ID = "sandustryTestBlocksSource";
const TRASH_ID = "sandustryTestBlocksTrash";
const THERMAL_SOURCE_ID = "sandustryTestBlocksThermalSource";
// Keep the saved type id stable while exposing the structure as Chill.
const CHILL_ID = "sandustryTestBlocksCold";
const POWER_ID = "sandustryTestBlocksPower";
const TEST_BLOCKS_CATEGORY = "testBlocks";
const SPRITE_SET_SETTING = "spriteSet";
type SpriteSetDefinition = {
  source: string;
  trash: string;
  heat: string;
  chill: string;
  energy: string;
};
const SPRITE_FILE_NAMES = {
  source: "element.png",
  trash: "trash.png",
  heat: "heat.png",
  chill: "chill.png",
  energy: "power.png",
} as const;
const SPRITE_SETS: Record<string, SpriteSetDefinition> = {
  purple: {
    source: "sandustryTestBlocksPurpleSourceSprite",
    trash: "sandustryTestBlocksPurpleTrashSprite",
    heat: "sandustryTestBlocksPurpleHeatSourceSprite",
    chill: "sandustryTestBlocksPurpleChillSprite",
    energy: "sandustryTestBlocksPurpleEnergySourceSprite",
  },
  v1: {
    source: "sandustryTestBlocksV1SourceSprite",
    trash: "sandustryTestBlocksV1TrashSprite",
    heat: "sandustryTestBlocksV1HeatSourceSprite",
    chill: "sandustryTestBlocksV1ChillSprite",
    energy: "sandustryTestBlocksV1EnergySourceSprite",
  },
  colorful: {
    source: "sandustryTestBlocksColorfulSourceSprite",
    trash: "sandustryTestBlocksColorfulTrashSprite",
    heat: "sandustryTestBlocksColorfulHeatSourceSprite",
    chill: "sandustryTestBlocksColorfulChillSprite",
    energy: "sandustryTestBlocksColorfulEnergySourceSprite",
  },
} as const;
const SPRITE_SET_LABELS = {
  purple: "Editor Extensions",
  v1: "Sandustry Demo",
  colorful: "Colorful (Sir Monkz)",
} as const;
const SOURCE_TICK_MS = 500;
const TRASH_PROCESS_INTERVAL_MS = 16;
const THERMAL_SOURCE_TICK_MS = 1000;
const POWER_TICK_MS = 1000;
const POWER_GLOBAL_ENERGY_TARGET = 1_000_000;
const POWER_STORAGE_CAPACITY = 1_000_000;
const THERMAL_SOURCE_DEFAULT_TEMPERATURE = 1000;
const CHILL_DEFAULT_TEMPERATURE = -1000;
const THERMAL_SOURCE_MIN_TEMPERATURE = -1000;
const THERMAL_SOURCE_MAX_TEMPERATURE = 1000;
const THERMAL_SOURCE_EXCHANGE_RATE = 0.5;
const DEFAULT_ELEMENT_ID = "sand";
const LAST_ELEMENT_KEY = `${MOD_ID}.lastElement`;
// Add unfinished or unwanted element IDs here. The picker, manual fallback,
// and runtime source check all use this same list.
const BLACKLISTED_ELEMENT_IDS = new Set([
  "caulk",
  "cloud",
  "coolant",
  "growingVoidSeed",
  "hyperpressure",
  "oil",
  "pressurizedWater",
  "pyronol",
  "reactorCore",
  "retroConsoleCasing",
  "retroConsolePixelOff",
  "retroConsolePixelOn",
  "slowFlow",
  "sunsand",
  "waterPressure",
]);
// Core elements without a string ID are filtered by numeric type instead.
// Type 2 is the element reported as [NO KEY]/[NO NAME].
const BLACKLISTED_ELEMENT_TYPES = new Set([2]);
const SIZE = 4;
const SOURCE_BRUSH_INTERVAL_MS = SOURCE_TICK_MS / (SIZE * SIZE);
const FOOTPRINT = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const TEXT = {
  "ui|management|category|testBlocks": "Infinite Test Blocks",
  "settings|spriteSet|label": "Sprite set",
  "settings|spriteSet|description":
    "Choose the visual theme for Test Blocks. Reload the game for changes to take effect.",
  "settings|spriteSet|option|purple": SPRITE_SET_LABELS.purple,
  "settings|spriteSet|option|v1": SPRITE_SET_LABELS.v1,
  "settings|spriteSet|option|colorful": SPRITE_SET_LABELS.colorful,
  "structures|source|name": "Elements",
  "structures|source|description": "Creates an endless stream of the configured element.",
  "structures|trash|name": "Trash",
  "structures|trash|description": "An infinitely deep void for particle trash.",
  "structures|thermalSource|name": "Heat",
  "structures|thermalSource|description":
    "Maintains a hot thermal buffer and shares heat with adjacent relays.",
  "structures|chill|name": "Chill",
  "structures|chill|description":
    "Maintains a low-temperature thermal buffer and shares heat with adjacent relays.",
  "structures|power|name": "Power",
  "structures|power|description":
    "Stores one million energy and keeps the global pool at that level.",
};

type ElementSelection = { id: string | null; type: number | null };
type SpriteSetKey = keyof typeof SPRITE_SETS;

const getSpriteSet = (): SpriteSetDefinition => {
  const selected = safe(() => api.settings.get<string>(SPRITE_SET_SETTING), "v1");
  const selectedKey = selected as SpriteSetKey;
  return SPRITE_SETS[selectedKey] ?? SPRITE_SETS.purple;
};
type ValidElementSelection = { id: string | null; type: number };
type FocusableButtonProps = {
  id: string;
  onActivate: () => void;
  neighbors?: Record<string, string | undefined>;
  className?: string;
  children?: any;
  [key: string]: unknown;
};
type ElementGridButtonProps = {
  entry: PickerElement;
  index: number;
  entries: PickerElement[];
  selected: boolean;
  onSelect: () => void;
};
const configuredSources = new Set<string>();
const sourceSelections = new Map<string, ElementSelection>();
const configuringSources = new Set<string>();
const disabledSources = new Set<string>();
const sourceBrushCursors = new Map<string, number>();
const sourceBrushOrders = new Map<string, number[]>();
const PICKER_ID = `${MOD_ID}-element-picker`;
let pickerState: PickerRuntimeState | null = null;
let pickerOverlayReady = false;
let pickerRepaint: ((update: (value: number) => number) => void) | null = null;
let pickerPromise: Promise<ElementSelection | null> | null = null;
let lastElementSelection: ElementSelection | null = null;
const UIReact = sandkit.react ?? null;
const HOTBAR_OVERLAY_SLOT = "hotbar";

const safe = <T,>(fn: () => T, fallback: T | null = null): T | null => {
  try {
    return fn();
  } catch (error) {
    noop(error);
    return fallback;
  }
};

const sourceKey = (structure: SandustryStructure) => `${structure.x},${structure.y}`;

const selectionData = (selection: ElementSelection): SandustryStructureData => ({
  elementId: selection.id || null,
  elementType: selection.type,
});

const validElementSelection = (
  selection: ElementSelection | null | undefined,
): ValidElementSelection | null => {
  if (!selection || typeof selection.type !== "number" || !Number.isInteger(selection.type))
    return null;
  const definition = safe(() => api.elements.getDefinitionByType(selection.type), null);
  if (!definition || !isElementTypeAllowed(selection.type)) return null;
  if (!isElementAllowed(selection.id, definition)) return null;
  return {
    id: definition.id || selection.id || null,
    type: selection.type,
  };
};

const getLastElement = () => {
  const saved = safe(() => api.storage.local.get(LAST_ELEMENT_KEY));
  let candidate = saved;
  if (typeof saved === "string") {
    if (saved.startsWith("type:")) {
      candidate = { type: Number(saved.slice(5)), id: null };
    } else if (saved.startsWith("id:")) {
      const id = saved.slice(3);
      candidate = {
        id,
        type: safe(() => api.elements.getTypeFromId(id), null),
      };
    }
  } else if (Number.isInteger(saved)) {
    candidate = { type: saved, id: null };
  }

  return (
    validElementSelection(candidate as ElementSelection | null) ||
    validElementSelection(lastElementSelection)
  );
};

const rememberElement = (selection: ElementSelection) => {
  const valid = validElementSelection(selection);
  if (valid) {
    lastElementSelection = valid;
    const value = valid.id ? `id:${valid.id}` : `type:${valid.type}`;
    safe(() => api.storage.local.set(LAST_ELEMENT_KEY, value));
  }
  return valid;
};

const defaultElementSelection = () => {
  const remembered = getLastElement();
  if (remembered) return remembered;

  const type = safe(() => api.elements.getTypeFromId(DEFAULT_ELEMENT_ID), null);
  return (
    validElementSelection({ id: DEFAULT_ELEMENT_ID, type }) || {
      id: DEFAULT_ELEMENT_ID,
      type: null,
    }
  );
};

const sourceElementSelection = (structure: SandustryStructure) => {
  if (Number.isInteger(structure.data?.elementType)) {
    const storedId = structure.data?.elementId;
    const elementType = structure.data?.elementType;
    const idMatchesType =
      storedId && safe(() => api.elements.getTypeFromId(storedId), null) === elementType;
    return validElementSelection({
      id: idMatchesType ? storedId : null,
      type: elementType ?? null,
    });
  }

  if (structure.data?.elementId) {
    const id = structure.data.elementId;
    return validElementSelection({
      id,
      type: safe(() => api.elements.getTypeFromId(id), null),
    });
  }

  return defaultElementSelection();
};

const isElementAllowed = (
  elementId: string | null | undefined,
  definition: SandustryElementDefinition | null = null,
) => {
  if (elementId && BLACKLISTED_ELEMENT_IDS.has(elementId)) return false;
  const resolved =
    definition ||
    safe(() => api.elements.getDefinitionByType(api.elements.getTypeFromId(elementId)), null);
  return !!resolved && resolved.hidden !== true;
};

const isElementTypeAllowed = (elementType: number) => !BLACKLISTED_ELEMENT_TYPES.has(elementType);

const elementIdFromSource = (structure: SandustryStructure) => {
  const requested = structure.data?.elementId || DEFAULT_ELEMENT_ID;
  return isElementAllowed(requested) ? requested : null;
};

const elementTypeFromSource = (structure: SandustryStructure) => {
  const storedType = structure.data?.elementType;
  if (typeof storedType === "number" && Number.isInteger(storedType)) {
    const definition = safe(() => api.elements.getDefinitionByType(storedType), null);
    return definition && definition.hidden !== true && isElementTypeAllowed(storedType)
      ? storedType
      : null;
  }

  const elementId = elementIdFromSource(structure);
  const elementType =
    elementId === null ? null : safe(() => api.elements.getTypeFromId(elementId), null);
  return elementType !== null && isElementTypeAllowed(elementType) ? elementType : null;
};

const elementEntries = (): PickerElement[] =>
  safe(
    () =>
      createElementCatalog({
        getRegisteredTypes: () => api.elements.getRegisteredTypes(),
        getDefinition: (type) => api.elements.getDefinitionByType(type),
        getName: (definition, fallback) =>
          safe(() => api.i18n.getName(definition), fallback) || fallback,
        isTypeAllowed: isElementTypeAllowed,
        isElementAllowed,
      }),
    [],
  ) || [];

const applySourceSelection = (structure: SandustryStructure, value: ElementSelection) => {
  const definition = safe(() => api.elements.getDefinitionByType(value.type), null);
  if (!definition || !isElementAllowed(value.id, definition)) return false;

  const selection = validElementSelection(value);
  if (!selection) return false;
  const key = sourceKey(structure);
  sourceSelections.set(key, selection);
  api.structures.setData(structure, selectionData(selection), {
    propagateToWorkers: true,
  });
  rememberElement(selection);
  disabledSources.delete(key);
  return true;
};

const closePicker = (value: unknown) => {
  const current = pickerState;
  if (!current) return;
  const selected =
    value && typeof value === "object" && Number.isInteger((value as ElementSelection).type)
      ? (value as ElementSelection)
      : null;
  pickerState = {
    ...current,
    current: selected ? selected.id : current.current,
    currentType: selected ? selected.type : current.currentType,
    // Completing a selection closes the expanded grid. This also removes the
    // previously controller-focused button so only the selected value remains
    // visibly active in the compact picker.
    minimized: true,
    resolve: null,
  };
  const resolve = current.resolve;
  pickerPromise = null;
  if (selected) rememberElement(selected);
  if (resolve) resolve(selected);
  if (pickerRepaint) pickerRepaint((value) => value + 1);
};

const expandPicker = () => {
  const state = pickerState;
  if (!state || !state.minimized) return;
  pickerState = { ...state, minimized: false };
  pickerPromise = new Promise<ElementSelection | null>((resolve) => {
    pickerState = { ...state, minimized: false, resolve };
  });
  if (pickerRepaint) pickerRepaint((value) => value + 1);
};

const minimizePicker = () => {
  if (!pickerState || pickerState.minimized) return;
  pickerState = { ...pickerState, minimized: true };
  if (pickerRepaint) pickerRepaint((value) => value + 1);
};

const NAV_SCOPE = `${PICKER_ID}-scope`;

const FocusableButton = ({
  id,
  onActivate,
  neighbors,
  className = "",
  children,
  ...props
}: FocusableButtonProps) => {
  if (!UIReact) return null;
  const navigation = api.ui.navigation;
  const focusable = navigation.useFocusable({
    id,
    scope: NAV_SCOPE,
    onActivate,
    neighbors,
    scrollIntoView: true,
  });
  const focusClass = navigation.controllerFocusClass(focusable.focused);

  return (
    <button
      {...props}
      ref={focusable.ref}
      type="button"
      onClick={onActivate}
      className={`${className} ${focusClass}`.trim()}
    >
      {children}
    </button>
  );
};

const ElementGridButton = ({
  entry,
  index,
  entries,
  selected,
  onSelect,
}: ElementGridButtonProps) => {
  if (!UIReact) return null;
  const id = `${PICKER_ID}-element-${entry.id || `type-${entry.type}`}`;
  const column = index % 4;
  const neighbors = {
    left:
      column > 0
        ? `${PICKER_ID}-element-${entries[index - 1].id || `type-${entries[index - 1].type}`}`
        : `${PICKER_ID}-matter-All`,
    right:
      column < 3 && entries[index + 1]
        ? `${PICKER_ID}-element-${entries[index + 1].id || `type-${entries[index + 1].type}`}`
        : undefined,
    up:
      index >= 4
        ? `${PICKER_ID}-element-${entries[index - 4].id || `type-${entries[index - 4].type}`}`
        : `${PICKER_ID}-matter-All`,
    down: entries[index + 4]
      ? `${PICKER_ID}-element-${entries[index + 4].id || `type-${entries[index + 4].type}`}`
      : undefined,
  };
  const focusable = api.ui.navigation.useFocusable({
    id,
    scope: NAV_SCOPE,
    onActivate: onSelect,
    neighbors,
    scrollIntoView: true,
  });
  const focusClass = api.ui.navigation.controllerFocusClass(focusable.focused);
  const select = () => {
    focusable.focus();
    onSelect();
  };
  return (
    <ElementRow
      element={entry}
      selected={selected}
      buttonRef={focusable.ref}
      onClick={select}
      className={focusClass}
    />
  );
};

const currentPickerEntry = (): PickerElement | null => {
  const state = pickerState;
  if (!state) return null;
  const entries = elementEntries();
  return findSelectedElement(
    entries,
    { id: state.current, type: state.currentType },
    DEFAULT_ELEMENT_ID,
  );
};

const selectedActionIsSource = () => {
  if (!api.action) return null;
  const selected = safe(() => api.action?.getSelected(), null);
  return selected?.id === SOURCE_ID;
};

const syncPickerToSelectedAction = () => {
  if (!UIReact || !registerPicker()) return;

  const sourceSelected = selectedActionIsSource();
  if (sourceSelected && !pickerState) {
    const current = defaultElementSelection();
    pickerState = {
      current: current.id,
      currentType: current.type,
      minimized: true,
      resolve: null,
    };
    if (pickerRepaint) pickerRepaint((value) => value + 1);
    return;
  }

  if (sourceSelected === false && pickerState && configuringSources.size === 0) {
    const resolve = pickerState.resolve;
    pickerState = null;
    pickerPromise = null;
    if (resolve) resolve(null);
    if (pickerRepaint) pickerRepaint((value) => value + 1);
  }
};

const ElementPicker = () => {
  if (!UIReact) return null;
  const [query, setQuery] = UIReact.useState("");
  const [matter, setMatter] = UIReact.useState("All");
  const [, bump] = UIReact.useState(0);

  api.ui.navigation.useFocusScope({
    id: NAV_SCOPE,
    active: !!pickerState,
    priority: 100,
    defaultId: pickerState?.minimized ? `${PICKER_ID}-selected` : `${PICKER_ID}-search`,
    onBack: () => {
      if (pickerState && !pickerState.minimized) {
        minimizePicker();
        return true;
      }
      return false;
    },
  });

  UIReact.useEffect(() => {
    pickerRepaint = bump;
    return () => {
      if (pickerRepaint === bump) pickerRepaint = null;
    };
  }, []);

  const searchFocus = api.ui.navigation.useFocusable({
    id: `${PICKER_ID}-search`,
    scope: NAV_SCOPE,
    onActivate: (element: HTMLElement | null) => element?.focus(),
    neighbors: {
      up: `${PICKER_ID}-minimize`,
      down: `${PICKER_ID}-matter-All`,
    },
    scrollIntoView: true,
  });

  if (!pickerState) return null;
  const picker = pickerState;

  if (pickerState.minimized) {
    const selected = currentPickerEntry();
    return (
      <div
        className="pointer-events-auto flex items-center gap-2 bg-black bg-opacity-75 border border-slate-700 rounded px-3 py-2 ui-box text-slate-300"
        onClick={expandPicker}
      >
        <span className="text-white text-xs opacity-70">Source</span>
        <FocusableButton
          id={`${PICKER_ID}-selected`}
          onActivate={expandPicker}
          className="flex items-center gap-2 text-xs text-white hover:text-[#ffe700]"
        >
          <span
            className="w-3 h-3 flex-shrink-0"
            style={{ backgroundColor: selected?.color || "#9aa7b5" }}
          />
          {selected?.name || DEFAULT_ELEMENT_ID}
        </FocusableButton>
        <span className="text-xs text-slate-500">Click to expand</span>
      </div>
    );
  }

  const queryState = { query, matter };
  const entries = filterElements(elementEntries(), queryState);
  const matters = matterTabs(elementEntries());
  const isSelected = (entry: PickerElement): boolean =>
    isSelectedElement(entry, { id: picker.current, type: picker.currentType });

  return (
    <div
      className="pointer-events-auto flex min-h-0 flex-col overflow-hidden bg-black bg-opacity-75 border border-slate-700 rounded ui-box text-slate-300"
      style={{
        width: "640px",
        maxWidth: "640px",
        maxHeight: "600px",
      }}
    >
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-white text-xs opacity-70">Source</span>
        <div className="flex items-center gap-2">
          <FocusableButton
            id={`${PICKER_ID}-minimize`}
            onActivate={minimizePicker}
            neighbors={{ down: `${PICKER_ID}-search` }}
            className="text-xs px-2 py-0.5 text-white bg-black border rounded-tr-lg rounded-bl-lg item-button-transition hover:text-[#ffe700] border-slate-200 border-opacity-25 hover:border-opacity-0"
          >
            Minimize ▾
          </FocusableButton>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-2 items-stretch">
        <div className="w-full">
          <SearchInput
            inputRef={searchFocus.ref}
            value={query}
            placeholder="Search elements..."
            onChange={setQuery}
            onEscape={minimizePicker}
            onClear={() => setQuery("")}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {matters.map((name, index) => (
            <FocusableButton
              key={name}
              id={`${PICKER_ID}-matter-${name}`}
              neighbors={{
                left: index > 0 ? `${PICKER_ID}-matter-${matters[index - 1]}` : undefined,
                right:
                  index + 1 < matters.length
                    ? `${PICKER_ID}-matter-${matters[index + 1]}`
                    : undefined,
                up: `${PICKER_ID}-search`,
                down: `${PICKER_ID}-element-0`,
              }}
              className={matterTabClass(matter === name)}
              onActivate={() => setMatter(name)}
            >
              {name}
            </FocusableButton>
          ))}
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
        style={{ maxHeight: "min(480px, calc(100vh - 190px))" }}
      >
        {entries.length ? (
          <div className="grid grid-cols-4 gap-1.5 py-1.5">
            {entries.map((entry, index) => (
              <ElementGridButton
                key={entry.id || `type-${entry.type}`}
                entry={entry}
                index={index}
                entries={entries}
                selected={isSelected(entry)}
                onSelect={() => closePicker(entry)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-600">
            <span className="text-xs">
              {query.trim() ? `No elements match “${query.trim()}”.` : "No elements available."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const PickerFallbackHost = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[10000] flex items-end justify-center px-4"
    style={{ paddingBottom: "clamp(72px, 10vh, 96px)" }}
  >
    <ElementPicker />
  </div>
);

const registerPicker = () => {
  if (pickerOverlayReady) return true;
  if (!UIReact) return false;
  try {
    api.ui.overlays.register(HOTBAR_OVERLAY_SLOT, PICKER_ID, () => <ElementPicker />);
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
    console.error(`[${MOD_ID}] element picker unavailable:`, error);
    return false;
  }
};

const openElementPicker = async (
  current: ElementSelection,
): Promise<string | ElementSelection | null> => {
  if (registerPicker()) {
    if (pickerState && pickerState.minimized) {
      return currentPickerEntry() as ElementSelection | null;
    }
    if (pickerPromise) return pickerPromise;

    pickerPromise = new Promise((resolve) => {
      pickerState = {
        current: current.id,
        currentType: current.type,
        minimized: false,
        resolve,
      };
      if (pickerRepaint) pickerRepaint((value) => value + 1);
    });
    return pickerPromise;
  }

  // Fallback for runtimes that do not expose React or the modal overlay slot.
  return api.ui.prompt(
    `Enter an element ID to emit (default: ${current.id || DEFAULT_ELEMENT_ID}).`,
    current.id || DEFAULT_ELEMENT_ID,
    "Element ID",
    "Configure Infinite Source",
  );
};

const configureSource = async (
  structure: SandustryStructure,
  initialSelection: ElementSelection | null,
) => {
  const key = sourceKey(structure);
  if (configuringSources.has(key)) return;
  configuringSources.add(key);

  try {
    const current =
      initialSelection || sourceElementSelection(structure) || defaultElementSelection();
    const value = await openElementPicker(current);

    // Closing the dialog keeps the default. A bad ID is also rejected rather
    // than leaving a source that fails on every trigger tick.
    if (value === null || (typeof value === "string" && value.trim() === "")) {
      disabledSources.add(key);
      return;
    }
    if (typeof value === "object" && Number.isInteger(value.type)) {
      if (!applySourceSelection(structure, value)) {
        disabledSources.add(key);
        return;
      }
      return;
    }

    if (typeof value !== "string") return;
    const elementId = value.trim();
    const elementType = safe(() => api.elements.getTypeFromId(elementId), null);
    if (
      elementType === null ||
      !isElementTypeAllowed(elementType) ||
      !isElementAllowed(elementId)
    ) {
      disabledSources.add(key);
      return;
    }

    const selection = validElementSelection({
      id: elementId,
      type: elementType,
    });
    if (!selection) return;
    applySourceSelection(structure, selection);
  } catch (error) {
    console.error(`[${MOD_ID}] source configuration failed:`, error);
  } finally {
    configuringSources.delete(key);
  }
};

const sourceTick = () => {
  syncPickerToSelectedAction();
  const live = new Set<string>();

  api.structures.forEachOfType(SOURCE_ID, (structure) => {
    const key = sourceKey(structure);
    live.add(key);

    // The default value is stored immediately so the structure has valid data,
    // but it must not be emitted while the configuration prompt is open.
    if (configuringSources.has(key) || disabledSources.has(key)) return;

    if (!configuredSources.has(key)) {
      configuredSources.add(key);
      const needsConfiguration =
        !structure.data?.elementId && !Number.isInteger(structure.data?.elementType);
      if (needsConfiguration) {
        const initialSelection = sourceElementSelection(structure);
        if (!initialSelection) return;
        sourceSelections.set(key, initialSelection);
        api.structures.setData(structure, selectionData(initialSelection), {
          propagateToWorkers: true,
        });
        void configureSource(structure, initialSelection);
        // Do not emit the default element while the placement configuration
        // prompt is still open.
        return;
      }
    }

    const elementType = sourceSelections.get(key)?.type ?? elementTypeFromSource(structure);
    if (typeof elementType !== "number") return;

    spawnSourceBrush(structure, elementType);
  });

  for (const key of configuredSources) {
    if (!live.has(key)) {
      configuredSources.delete(key);
      sourceSelections.delete(key);
      disabledSources.delete(key);
      sourceBrushCursors.delete(key);
      sourceBrushOrders.delete(key);
    }
  }
};

const spawnSourceBrush = (structure: SandustryStructure, elementType: number) => {
  const key = sourceKey(structure);
  const cursor = sourceBrushCursors.get(key) ?? 0;
  let order = sourceBrushOrders.get(key);
  if (!order || cursor === 0) {
    order = Array.from({ length: SIZE * SIZE }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = api.random.int(0, index);
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }
    sourceBrushOrders.set(key, order);
  }
  const cell = order[cursor];
  const cellX = structure.x + (cell % SIZE);
  const cellY = structure.y + Math.floor(cell / SIZE);
  sourceBrushCursors.set(key, (cursor + 1) % (SIZE * SIZE));

  // The public helper performs the empty-cell check and idle-safe mutation.
  api.elements.createAtCellWhenIdle(cellX, cellY, elementType);
};

const processTrash = (structure: SandustryStructure) => {
  api.grid.forEachCellInRectangle(structure.x, structure.y, SIZE, SIZE, (cellX, cellY) => {
    // The API helper performs the same empty-cell check as the native element
    // removal path. Let it handle that work instead of reading each cell here
    // before scheduling the removal.
    api.elements.removeAtCellWhenIdle(cellX, cellY);
  });
};

const thermalTemperature = (structure: SandustryStructure) => {
  const heatTransfer = engine.api.heatTransfer;
  return heatTransfer ? heatTransfer.ensureTemperature(structure) : 0;
};

const addThermalTemperature = (structure: SandustryStructure, delta: number) => {
  const heatTransfer = engine.api.heatTransfer;
  if (!heatTransfer || delta === 0) return;
  heatTransfer.addTemperature(engine.state, structure, delta);
};

const thermalRingCells = (structure: SandustryStructure) => {
  const cells: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < SIZE; index += 1) {
    cells.push({ x: structure.x + index, y: structure.y - SIZE });
    cells.push({ x: structure.x + index, y: structure.y + SIZE });
    cells.push({ x: structure.x - SIZE, y: structure.y + index });
    cells.push({ x: structure.x + SIZE, y: structure.y + index });
  }
  return cells;
};

const touchingThermalRelays = (sources: SandustryStructure[]) => {
  const relays: SandustryStructure[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    for (const cell of thermalRingCells(source)) {
      const relay = safe(() => api.structures.getAtCell(cell.x, cell.y), null);
      if (!relay || relay.type !== "thermalRelay" || relay.queued) continue;
      const key = `${relay.x},${relay.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relays.push(relay);
    }
  }
  return relays;
};

const absorbThermalSurroundings = (structure: SandustryStructure) => {
  const heatTransfer = engine.api.heatTransfer;
  if (!heatTransfer?.absorbAdjacentElements) return;
  const current = thermalTemperature(structure);
  const delta = heatTransfer.absorbAdjacentElements(engine.state, structure, {
    lavaDelta: 250,
    snowDelta: -20,
    currentTemperature: current,
    minTemperature: THERMAL_SOURCE_MIN_TEMPERATURE,
    maxTemperature: THERMAL_SOURCE_MAX_TEMPERATURE,
    structSize: SIZE,
  });
  if (delta) addThermalTemperature(structure, delta);
};

const thermalSourceTick = () => {
  const sources: SandustryStructure[] = [];
  for (const type of [THERMAL_SOURCE_ID, CHILL_ID]) {
    api.structures.forEachOfType(type, (structure) => {
      try {
        absorbThermalSurroundings(structure);
        sources.push(structure);
      } catch (error) {
        console.error(`[${MOD_ID}] thermal source tick failed:`, error);
      }
    });
  }
  if (sources.length === 0) return;

  // Native machines can consume from this block through the bundle patch. A
  // nearby native relay also trades with it using the game's 50% diffusion
  // behavior, without replacing the native relay network.
  for (const relay of touchingThermalRelays(sources)) {
    const source = sources.find((candidate) =>
      thermalRingCells(candidate).some((cell) => cell.x === relay.x && cell.y === relay.y),
    );
    if (!source) continue;
    const move =
      (thermalTemperature(source) - thermalTemperature(relay)) * THERMAL_SOURCE_EXCHANGE_RATE;
    addThermalTemperature(source, -move);
    addThermalTemperature(relay, move);
  }

  for (const source of sources) {
    const target =
      typeof source.data?.targetTemperature === "number"
        ? source.data.targetTemperature
        : source.type === CHILL_ID
          ? CHILL_DEFAULT_TEMPERATURE
          : THERMAL_SOURCE_DEFAULT_TEMPERATURE;
    addThermalTemperature(source, target - thermalTemperature(source));
  }
};

let nextThermalSourceTick = 0;
const registerThermalSourceTick = () => {
  api.events.on("frame:render", () => {
    const now = Date.now();
    if (now < nextThermalSourceTick) return;
    nextThermalSourceTick = now + THERMAL_SOURCE_TICK_MS;
    thermalSourceTick();
  });
};

type GlobalEnergyState = SandustryEngineState & {
  shared?: { energy?: Uint32Array };
  store: SandustryEngineState["store"] & {
    resources?: { energy?: number };
  };
};

const globalEnergy = () => {
  const state = engine.state as GlobalEnergyState;
  const sharedEnergy = state.shared?.energy;
  if (sharedEnergy && typeof Atomics?.load === "function") {
    return Atomics.load(sharedEnergy, 0);
  }
  return state.store.resources?.energy ?? 0;
};

const maintainGlobalEnergy = () => {
  const delta = POWER_GLOBAL_ENERGY_TARGET - globalEnergy();
  if (delta === 0) return;
  api.resources.updateEnergy(delta);
};

const maintainPowerStorage = (structure: SandustryStructure) => {
  const data = structure.data ?? {};
  if (data.maxEnergy === POWER_STORAGE_CAPACITY && data.storedEnergy === POWER_STORAGE_CAPACITY) {
    return;
  }
  api.structures.setData(structure, {
    ...data,
    maxEnergy: POWER_STORAGE_CAPACITY,
    storedEnergy: POWER_STORAGE_CAPACITY,
  });
};

let nextPowerTick = 0;
const registerPowerTick = () => {
  api.events.on("frame:render", () => {
    const now = Date.now();
    if (now < nextPowerTick) return;
    nextPowerTick = now + POWER_TICK_MS;

    let hasPowerBlock = false;
    api.structures.forEachOfType(POWER_ID, (structure) => {
      hasPowerBlock = true;
      maintainPowerStorage(structure);
    });
    if (hasPowerBlock) maintainGlobalEnergy();
  });
};

// The native thermal consumers ask for the exact "thermalRelay" type. The
// bundle patch calls this predicate so they can also consume from our source.
Object.assign(globalThis, {
  __sandustryTestBlocksThermalSource: (type: unknown, expected: unknown) =>
    (type === THERMAL_SOURCE_ID || type === CHILL_ID) &&
    (expected === "thermalRelay" || expected === type),
});

const registerTrashProcessor = () => {
  const trashType = api.structures.getTypeFromId?.(TRASH_ID) ?? TRASH_ID;
  api.structures.addProcessor(trashType, {
    intervalMs: TRASH_PROCESS_INTERVAL_MS,
    process: (structure) => {
      try {
        processTrash(structure);
      } catch (error) {
        console.error(`[${MOD_ID}] trash processor failed:`, error);
      }
    },
  });
};

const setup = async () => {
  api.i18n.register("en", TEXT);
  registerPicker();

  for (const [key, spriteSet] of Object.entries(SPRITE_SETS)) {
    const assetPath = (name: keyof typeof SPRITE_FILE_NAMES) =>
      `assets/${key}/${SPRITE_FILE_NAMES[name]}`;
    try {
      await Promise.all([
        api.sprites.loadFromMod(spriteSet.source, assetPath("source")),
        api.sprites.loadFromMod(spriteSet.trash, assetPath("trash")),
        api.sprites.loadFromMod(spriteSet.heat, assetPath("heat")),
        api.sprites.loadFromMod(spriteSet.chill, assetPath("chill")),
      ]);
      await api.sprites.loadFromMod(spriteSet.energy, assetPath("energy")).catch(() => {});
    } catch {
      console.warn(`[${MOD_ID}] sprite set unavailable: ${key}`);
    }
  }
  const spriteSet = getSpriteSet();

  const common = {
    categoryKey: TEST_BLOCKS_CATEGORY,
    buildModes: [
      { type: "single" },
      {
        type: "line",
        directions: ["horizontal", "vertical"],
      },
    ],
    shape: FOOTPRINT,
    render: {
      size: { width: 16, height: 16 },
      offset: { x: 0, y: 0 },
    },
  };

  api.structures.register({
    ...common,
    id: SOURCE_ID,
    order: 10,
    nameKey: "structures|source|name",
    descriptionKey: "structures|source|description",
    variants: [{ id: SOURCE_ID, angles: [0, 90, 180, 270] }],
    render: { ...common.render, imageName: spriteSet.source },
  });

  api.structures.register({
    ...common,
    id: TRASH_ID,
    categoryKey: TEST_BLOCKS_CATEGORY,
    order: 50,
    nameKey: "structures|trash|name",
    descriptionKey: "structures|trash|description",
    variants: [{ id: TRASH_ID, angles: [0, 90, 180, 270] }],
    render: { ...common.render, imageName: spriteSet.trash },
  });

  api.structures.register({
    id: THERMAL_SOURCE_ID,
    nameKey: "structures|thermalSource|name",
    descriptionKey: "structures|thermalSource|description",
    categoryKey: TEST_BLOCKS_CATEGORY,
    order: 20,
    alwaysUnlocked: true,
    buildModes: [
      { type: "single" },
      { type: "line", directions: ["horizontal", "vertical"] },
      { type: "rectangle" },
    ],
    variants: [{ id: THERMAL_SOURCE_ID, angles: [0, 90, 180, 270] }],
    copyData: false,
    useRawShape: true,
    defaultData: {
      temperature: 0,
      targetTemperature: THERMAL_SOURCE_DEFAULT_TEMPERATURE,
    },
    shape: [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    render: {
      imageName: spriteSet.heat,
      size: { width: 16, height: 16 },
      offset: { x: 0, y: 0 },
      ui: { outline: true },
    },
    tooltipHover: {
      type: "custom",
      dataFieldIconValue: {
        field: "temperature",
        iconPath: "mods/thermal_icon.png",
        round: true,
      },
    },
  });

  api.structures.register({
    id: CHILL_ID,
    nameKey: "structures|chill|name",
    descriptionKey: "structures|chill|description",
    categoryKey: TEST_BLOCKS_CATEGORY,
    order: 30,
    alwaysUnlocked: true,
    buildModes: [
      { type: "single" },
      { type: "line", directions: ["horizontal", "vertical"] },
      { type: "rectangle" },
    ],
    variants: [{ id: CHILL_ID, angles: [0, 90, 180, 270] }],
    copyData: false,
    useRawShape: true,
    defaultData: {
      temperature: 0,
      targetTemperature: CHILL_DEFAULT_TEMPERATURE,
    },
    shape: [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    render: {
      imageName: spriteSet.chill,
      size: { width: 16, height: 16 },
      offset: { x: 0, y: 0 },
      ui: { outline: true },
    },
    tooltipHover: {
      type: "custom",
      dataFieldIconValue: {
        field: "temperature",
        iconPath: "mods/thermal_icon.png",
        round: true,
      },
    },
  });

  api.structures.register({
    ...common,
    id: POWER_ID,
    order: 40,
    nameKey: "structures|power|name",
    descriptionKey: "structures|power|description",
    alwaysUnlocked: true,
    copyData: false,
    useRawShape: true,
    defaultData: {
      storedEnergy: 0,
      maxEnergy: POWER_STORAGE_CAPACITY,
    },
    shape: [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    variants: [{ id: POWER_ID, angles: [0, 90, 180, 270] }],
    render: { ...common.render, imageName: spriteSet.energy, ui: { outline: true } },
  });

  api.energy.registerType(POWER_ID, "storage", {
    priority: 1,
    spritesheetThresholds: [0, 1, 60, 100],
  });

  // Give Power blocks from an earlier dev build the same capacity as newly
  // placed blocks without disturbing their current stored energy.
  api.structures.forEachOfType(POWER_ID, (structure) => {
    if (structure.data?.maxEnergy === POWER_STORAGE_CAPACITY) return;
    api.structures.setData(structure, {
      ...structure.data,
      maxEnergy: POWER_STORAGE_CAPACITY,
    });
  });

  // These blocks are creative utility blocks, so they do not require a tech
  // node before appearing in the Production build category.
  api.player.buildings.unlockByType(SOURCE_ID);
  api.player.buildings.unlockByType(TRASH_ID);
  api.player.buildings.unlockByType(THERMAL_SOURCE_ID);
  api.player.buildings.unlockByType(CHILL_ID);
  api.player.buildings.unlockByType(POWER_ID);
  registerThermalSourceTick();
  registerPowerTick();

  api.triggers.register(`${MOD_ID}:source-tick`, {
    interval: SOURCE_BRUSH_INTERVAL_MS,
    callback: () => {
      try {
        sourceTick();
      } catch (error) {
        console.error(`[${MOD_ID}] source tick failed:`, error);
      }
    },
  });
  // Register immediately after the structure exists. The runtime's processor
  // registry indexes current structures when ready and listens for game:ready
  // when this mod is loaded before the save is restored.
  registerTrashProcessor();
};

try {
  await setup();
} catch (error) {
  console.error(`[${MOD_ID}] load failed:`, error);
}
