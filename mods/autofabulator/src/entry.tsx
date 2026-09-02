import { onDispose } from "../../../shared/dev-hmr";

const api = sandkit.api;
const engine = sandkit.engine;

const internalTerrainApi = engine.api as unknown as {
  terrains?: {
    replaceAt?: (state: unknown, x: number, y: number, type: string) => void;
    removeAt?: (state: unknown, x: number, y: number) => void;
  };
};
const internalElementApi = engine.api as unknown as {
  elements?: {
    removeAt?: (state: unknown, x: number, y: number, options?: Record<string, unknown>) => void;
  };
};
const internalStructureApi = engine.api as unknown as {
  structures?: {
    build?: (
      state: unknown,
      position: { x: number; y: number; clearance?: number },
      type: string,
      options?: Record<string, unknown>,
    ) => SandustryStructure | null;
    removeAt?: (state: unknown, x: number, y: number, options?: Record<string, unknown>) => void;
    beginBatchWrite?: () => void;
    endBatchWrite?: () => void;
    getConfig?: (type: string) => Record<string, unknown> | undefined;
  };
};
const SET_PAUSED_MESSAGE = 54;
const BUILDING_CLEARANCE_AVAILABLE = 1;

const MOD_ID = "sorahn.sandustry-autofabulator";
const ITEM_ID = "sorahnAutofabulator";
const TOOL_SPRITE_ID = "sorahnAutofabulatorSprite";
const EDITOR_ID = "sorahn-autofabulator-editor";
const GRID_SIZE = 5;
const CELLS_PER_BLOCK = 4;
const CANVAS_SIZE = 360;
const ACTION_START = "1";
const PREFAB_TERRAIN_TYPE = "prefabTerrain_5";
const PREFAB_CELL_ID = 15;
const MAC_RIGHT_MOUSE_PROBE =
  "T2JqQy5pbXBvcnQoJ0NvY29hJyk7ZnVuY3Rpb24gYigpe2NvbnN0IHY9JC5OU0V2ZW50LnByZXNzZWRNb3VzZUJ1dHRvbnM7cmV0dXJuIE51bWJlcih0eXBlb2Ygdj09PSdmdW5jdGlvbic/digpOnYpO31pZighTnVtYmVyLmlzRmluaXRlKGIoKSkpdGhyb3cgbmV3IEVycm9yKCdubyBidXR0b24gc3RhdGUnKTt3aGlsZShiKCkmMil7ZGVsYXkoMC4wMTYpO30=";
const UIReact = sandkit.react ?? null;
let previousCursorStyle: unknown = null;
let marqueeCursorActive = false;

type OccupiedBlock = boolean[][];
type CapturedBlocks = {
  occupied: OccupiedBlock[][];
  painted: boolean[][][][];
  solidite: boolean[][][][];
  capturedSolidite: boolean[][][][];
};
type PaintMode = "prefab" | "solidite" | "erase";
type PainterEditorState = {
  originX: number;
  originY: number;
  painted: boolean[][][][];
  solidite: boolean[][][][];
  capturedSolidite: boolean[][][][];
  occupied: OccupiedBlock[][];
  initialPainted?: boolean[][][][];
  initialSolidite?: boolean[][][][];
  dirty?: boolean[][][][];
};

let editorState: PainterEditorState | null = null;
let editorRepaint: ((update: (value: number) => number) => void) | null = null;
let editorDispose: (() => void) | null = null;
let activePaintMode: PaintMode | null = null;
let nativePickerKeyActive = false;
let activePaintPointerId: number | null = null;
let activePaintCanvas: HTMLElement | null = null;
let activePaintLastCell: string | null = null;
let nativeRightWatchOwned = false;
let nativeRightListenersRegistered = false;

type MacRightMouseBridge = {
  watch?: (active: boolean, probeScript?: string) => void;
  onPos?: (callback: (x: number, y: number) => void) => void;
  onUp?: (callback: () => void) => void;
};

type Point = { x: number; y: number };
type InternalRenderingApi = {
  getCellDrawPos(state: SandustryEngineState, x: number, y: number): Point;
  getGridMetrics(): { cellSize: number; snapGridCellSize: number };
  withOverlayContext(
    state: SandustryEngineState,
    callback: (context: CanvasRenderingContext2D) => void,
  ): void;
};
const internalRendering = (engine.api as unknown as { rendering?: InternalRenderingApi }).rendering;

function macRightMouseBridge(): MacRightMouseBridge | null {
  return (
    ((window as unknown as { electron?: { macRightMouse?: MacRightMouseBridge } }).electron
      ?.macRightMouse as MacRightMouseBridge | undefined) ?? null
  );
}

function stopPaintingGesture(): void {
  const pointerId = activePaintPointerId;
  const canvas = activePaintCanvas;
  activePaintMode = null;
  activePaintPointerId = null;
  activePaintCanvas = null;
  activePaintLastCell = null;
  if (pointerId !== null && canvas?.hasPointerCapture?.(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
  if (nativeRightWatchOwned) {
    nativeRightWatchOwned = false;
    macRightMouseBridge()?.watch?.(false);
  }
}

function setSimulationPaused(paused: boolean): void {
  const state = engine.state as unknown as {
    session?: { paused?: boolean };
    environment?: {
      multithreading?: {
        simulation?: { manager?: { postMessage?: (message: unknown[]) => void } };
      };
    };
  };
  if (state.session) state.session.paused = paused;
  state.environment?.multithreading?.simulation?.manager?.postMessage?.([
    SET_PAUSED_MESSAGE,
    paused,
  ]);
}

function replaceTerrainImmediately(x: number, y: number, type: string): void {
  if (typeof internalTerrainApi.terrains?.replaceAt === "function") {
    internalTerrainApi.terrains.replaceAt(engine.state, x, y, type);
    return;
  }
  api.terrains.replaceAtCellWhenIdle(x, y, type);
}

function removeTerrainImmediately(x: number, y: number): void {
  if (typeof internalTerrainApi.terrains?.removeAt === "function") {
    internalTerrainApi.terrains.removeAt(engine.state, x, y);
    return;
  }
  api.terrains.removeAtCellWhenIdle(x, y);
}

function startNativeRightMouseWatch(): void {
  if (activePaintMode !== "erase" || nativeRightWatchOwned) return;
  const bridge = macRightMouseBridge();
  if (typeof bridge?.watch !== "function" || typeof bridge.onUp !== "function") return;
  nativeRightWatchOwned = true;
  bridge.watch(true, atob(MAC_RIGHT_MOUSE_PROBE));
}
const PANEL_BUTTON_STYLE = {
  position: "relative" as const,
  minHeight: 0,
  overflow: "hidden" as const,
  borderRadius: "0 4px 0 4px",
  border: "1px solid #cbd5e1",
  padding: "3px 6px",
  background: "#000",
  color: "#fff",
  fontSize: 10,
  fontWeight: 400,
  cursor: "pointer",
};
const ACCENT_BUTTON_STYLE = {
  ...PANEL_BUTTON_STYLE,
  border: "1px solid rgba(253, 224, 71, 0.5)",
  background: "rgba(253, 224, 71, 0.1)",
  color: "#fde047",
};

const TRANSLATIONS = {
  "mods|autofabulator|name": "Autofabulator",
  "mods|autofabulator|description": "Paint and place small prefab patterns.",
  "items|autofabulator|name": "Autofabulator",
  "items|autofabulator|description": "Paint and place a small prefab pattern.",
};

function inventoryContains(): boolean {
  const inventory = sandkit.engine.state?.store?.player?.inventory;
  return Array.isArray(inventory) && inventory.some((item) => String(item?.id) === ITEM_ID);
}

function grantAutofabulatorItem(): void {
  if (inventoryContains()) return;
  api.player.inventory.addFromId(ITEM_ID);
}

function nativePickerActive(state: SandustryEngineState = sandkit.engine.state): boolean {
  const session = state?.session as {
    input?: { keys?: Record<string, unknown> };
  };
  return Boolean(
    session?.input?.keys?.KeyF === 0 ||
    session?.input?.keys?.KeyF === 3 ||
    nativePickerKeyActive ||
    state?.store?.player?.action?.id === 7,
  );
}

function nativeSelectionActive(state: SandustryEngineState = sandkit.engine.state): boolean {
  const session = state?.session as {
    construction?: { demolisherActive?: boolean; marqueeActive?: boolean };
    action?: { customData?: { marqueeSelected?: boolean } | null };
  };
  return Boolean(
    session?.construction?.demolisherActive ||
    session?.construction?.marqueeActive ||
    session?.action?.customData?.marqueeSelected ||
    nativePickerActive(state),
  );
}

function setMarqueeCursor(state: SandustryEngineState): void {
  if (api.action?.getSelected()?.id !== ITEM_ID || nativeSelectionActive(state)) {
    restoreCursor(state);
    return;
  }
  const pixi = (state?.session as { rendering?: { pixi?: unknown } } | undefined)?.rendering
    ?.pixi as
    | {
        cursors?: { marquee?: unknown };
        app?: {
          renderer?: {
            events?: { cursorStyles?: { default?: unknown }; setCursor?: (value: unknown) => void };
          };
        };
      }
    | undefined;
  const events = pixi?.app?.renderer?.events;
  const marquee = pixi?.cursors?.marquee;
  if (!events?.cursorStyles || marquee === undefined) return;
  if (!marqueeCursorActive) {
    previousCursorStyle = events.cursorStyles.default ?? null;
    marqueeCursorActive = true;
  }
  events.cursorStyles.default = marquee;
  events.setCursor?.(marquee);
}

function restoreCursor(state: SandustryEngineState = sandkit.engine.state): void {
  if (!marqueeCursorActive) return;
  const pixi = (state?.session as { rendering?: { pixi?: unknown } } | undefined)?.rendering
    ?.pixi as
    | {
        cursors?: { default?: unknown };
        app?: {
          renderer?: {
            events?: { cursorStyles?: { default?: unknown }; setCursor?: (value: unknown) => void };
          };
        };
      }
    | undefined;
  const events = pixi?.app?.renderer?.events;
  if (events?.cursorStyles) {
    const restored = previousCursorStyle ?? pixi?.cursors?.default;
    events.cursorStyles.default = restored;
    events.setCursor?.(restored);
  }
  previousCursorStyle = null;
  marqueeCursorActive = false;
}

function drawBlockHighlight(state: SandustryEngineState): void {
  if (
    editorState ||
    api.action?.getSelected()?.id !== ITEM_ID ||
    nativeSelectionActive(state) ||
    !internalRendering?.withOverlayContext ||
    !internalRendering.getCellDrawPos
  )
    return;
  const cursor = api.input.getMouseCellPosition();
  const blockX = Math.floor(cursor.x / CELLS_PER_BLOCK) * CELLS_PER_BLOCK;
  const blockY = Math.floor(cursor.y / CELLS_PER_BLOCK) * CELLS_PER_BLOCK;
  const metrics = internalRendering.getGridMetrics();
  const size = metrics.cellSize * CELLS_PER_BLOCK;
  const draw = internalRendering.getCellDrawPos(state, blockX, blockY);

  internalRendering.withOverlayContext(state, (context) => {
    context.save();
    context.fillStyle = "rgba(255, 210, 60, 0.16)";
    context.strokeStyle = "rgba(255, 210, 60, 0.9)";
    context.lineWidth = 2;
    context.fillRect(draw.x, draw.y, size, size);
    const inset = 1;
    const corner = Math.max(4, Math.min(12, size * 0.22));
    const left = draw.x + inset;
    const top = draw.y + inset;
    const right = draw.x + size - inset;
    const bottom = draw.y + size - inset;
    context.beginPath();
    context.moveTo(left, top + corner);
    context.lineTo(left, top);
    context.lineTo(left + corner, top);
    context.moveTo(right - corner, top);
    context.lineTo(right, top);
    context.lineTo(right, top + corner);
    context.moveTo(right, bottom - corner);
    context.lineTo(right, bottom);
    context.lineTo(right - corner, bottom);
    context.moveTo(left + corner, bottom);
    context.lineTo(left, bottom);
    context.lineTo(left, bottom - corner);
    context.stroke();
    context.restore();
  });
}

function emptyPaintedGrid(): boolean[][][][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: CELLS_PER_BLOCK }, () => Array(CELLS_PER_BLOCK).fill(false)),
    ),
  );
}

function clonePaintedGrid(grid: boolean[][][][]): boolean[][][][] {
  return grid.map((blockRow) => blockRow.map((block) => block.map((cellRow) => cellRow.slice())));
}

function readCapturedBlocks(originX: number, originY: number): CapturedBlocks {
  const occupied = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: CELLS_PER_BLOCK }, () => Array(CELLS_PER_BLOCK).fill(false)),
    ),
  );
  const painted = emptyPaintedGrid();
  const solidite = emptyPaintedGrid();
  const capturedSolidite = emptyPaintedGrid();

  for (let blockY = 0; blockY < GRID_SIZE; blockY += 1) {
    for (let blockX = 0; blockX < GRID_SIZE; blockX += 1) {
      const blockOriginX = originX + blockX * CELLS_PER_BLOCK;
      const blockOriginY = originY + blockY * CELLS_PER_BLOCK;
      for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
        for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
          const x = blockOriginX + cellX;
          const y = blockOriginY + cellY;
          try {
            if (api.terrains?.isTypeAtCell?.(x, y, "solidite")) {
              solidite[blockY][blockX][cellY][cellX] = true;
              capturedSolidite[blockY][blockX][cellY][cellX] = true;
              continue;
            }
            const prefab = findPrefabStructureAtBlock(blockOriginX, blockOriginY);
            if (prefab) {
              const prefabX = x - prefab.x;
              const prefabY = y - prefab.y;
              const cellIds = readPrefabCellIds(prefab, prefab.x, prefab.y);
              if (
                prefabX >= 0 &&
                prefabX < CELLS_PER_BLOCK &&
                prefabY >= 0 &&
                prefabY < CELLS_PER_BLOCK &&
                cellIds[prefabY]?.[prefabX] === PREFAB_CELL_ID
              ) {
                painted[blockY][blockX][cellY][cellX] = true;
                continue;
              }
            }
            const structure = api.structures.getAtCell?.(x, y);
            const structureType = String(structure?.type ?? "").toLowerCase();
            if (
              structure &&
              !structureType.startsWith("prefabterrain") &&
              !structureType.includes("pipe") &&
              !structureType.includes("vent")
            ) {
              occupied[blockY][blockX][cellY][cellX] = true;
              continue;
            }
            if (api.elements?.getInfoAtCell?.(x, y)) continue;
            const cellId = api.world.getCellIdAtCell?.(x, y);
            if (Number.isInteger(cellId)) {
              if (cellId === 0) continue;
              if (api.terrains?.isCellIdTerrain?.(cellId) === true) {
                occupied[blockY][blockX][cellY][cellX] = true;
                continue;
              }
            } else if (api.world.isTerrainAtCell(x, y)) {
              occupied[blockY][blockX][cellY][cellX] = true;
              continue;
            }
          } catch {
            occupied[blockY][blockX][cellY][cellX] = false;
          }
        }
      }
    }
  }
  return { occupied, painted, solidite, capturedSolidite };
}

function refreshEditor(): void {
  editorRepaint?.((value) => value + 1);
  try {
    api.ui.update(EDITOR_ID);
  } catch {
    // The injected host may not be mounted during early initialization.
  }
}

function closeEditor(): void {
  editorState = null;
  stopPaintingGesture();
  refreshEditor();
}

function registerEditor(): boolean {
  if (editorDispose) return true;
  if (!UIReact) return false;
  try {
    const dispose = api.ui.inject(EDITOR_ID, AutofabulatorEditor);
    if (typeof dispose !== "function") return false;
    editorDispose = dispose;
    onDispose(() => {
      editorDispose?.();
      editorDispose = null;
      editorState = null;
      editorRepaint = null;
      stopPaintingGesture();
    });
    return true;
  } catch (error) {
    console.warn(`[${MOD_ID}] editor unavailable:`, error);
    return false;
  }
}

function openEditor(cursor = api.input.getMouseCellPosition()): void {
  if (editorState) return;
  if (!registerEditor()) {
    api.ui.toast("Autofabulator editor is unavailable.");
    return;
  }
  const selectedBlockX = Math.floor(cursor.x / CELLS_PER_BLOCK) * CELLS_PER_BLOCK;
  const selectedBlockY = Math.floor(cursor.y / CELLS_PER_BLOCK) * CELLS_PER_BLOCK;
  const half = Math.floor(GRID_SIZE / 2) * CELLS_PER_BLOCK;
  const originX = selectedBlockX - half;
  const originY = selectedBlockY - half;
  const captured = readCapturedBlocks(originX, originY);
  editorState = {
    originX,
    originY,
    painted: captured.painted,
    solidite: captured.solidite,
    capturedSolidite: captured.capturedSolidite,
    occupied: captured.occupied,
    initialPainted: clonePaintedGrid(captured.painted),
    initialSolidite: clonePaintedGrid(captured.solidite),
    dirty: emptyPaintedGrid(),
  };
  restoreCursor();
  refreshEditor();
}

function registerClickInterceptor(): void {
  const intercept = api.hooks?.intercept;
  if (typeof intercept !== "function") {
    console.warn(`[${MOD_ID}] action click interception is unavailable`);
    return;
  }

  const dispose = intercept(
    "action:intercept",
    (payload: any, control: any) => {
      if (api.action?.getSelected()?.id !== ITEM_ID) return;
      if (editorState || nativePickerActive()) {
        control?.cancel?.();
        return;
      }
      if (nativeSelectionActive()) return;
      if (!Number.isInteger(payload?.cellX) || !Number.isInteger(payload?.cellY)) return;

      openEditor({ x: payload.cellX, y: payload.cellY });
      control?.cancel?.();
    },
    { priority: -1000 },
  );

  if (typeof dispose === "function") onDispose(dispose);
}

function paintEditorCell(
  blockX: number,
  blockY: number,
  cellX: number,
  cellY: number,
  mode: PaintMode,
): void {
  if (!editorState) return;
  if (editorState.occupied[blockY][blockX][cellY][cellX]) return;
  let painted = false;
  let solidite = false;
  if (mode === "prefab") {
    painted = true;
  } else if (mode === "solidite") {
    solidite = true;
  }
  editorState.painted[blockY][blockX][cellY][cellX] = painted;
  editorState.solidite[blockY][blockX][cellY][cellX] = solidite;
  if (editorState.dirty) {
    editorState.dirty[blockY][blockX][cellY][cellX] =
      painted !== Boolean(editorState.initialPainted?.[blockY]?.[blockX]?.[cellY]?.[cellX]) ||
      solidite !== Boolean(editorState.initialSolidite?.[blockY]?.[blockX]?.[cellY]?.[cellX]);
  }
  refreshEditor();
}

function cellAtClientPoint(clientX: number, clientY: number): HTMLElement | null {
  const target = document.elementFromPoint(clientX, clientY);
  return target instanceof HTMLElement ? target.closest<HTMLElement>("[data-autofab-cell]") : null;
}

function paintEditorCellElement(cell: HTMLElement): void {
  const key = cell.dataset.autofabCell;
  if (!key || key === activePaintLastCell) return;
  const coordinates = key.split(":").map(Number);
  if (coordinates.some((value) => !Number.isInteger(value))) return;
  const [blockX, blockY, cellX, cellY] = coordinates;
  activePaintLastCell = key;
  if (activePaintMode) paintEditorCell(blockX, blockY, cellX, cellY, activePaintMode);
}

function paintEditorCellAtClientPoint(clientX: number, clientY: number): void {
  const cell = cellAtClientPoint(clientX, clientY);
  if (cell) paintEditorCellElement(cell);
}

function clearEditor(): void {
  if (!editorState) return;
  for (let blockY = 0; blockY < GRID_SIZE; blockY += 1) {
    for (let blockX = 0; blockX < GRID_SIZE; blockX += 1) {
      for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
        for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
          if (editorState.occupied[blockY][blockX][cellY][cellX]) continue;
          editorState.painted[blockY][blockX][cellY][cellX] = false;
          editorState.solidite[blockY][blockX][cellY][cellX] = false;
          if (editorState.dirty) {
            editorState.dirty[blockY][blockX][cellY][cellX] =
              Boolean(editorState.initialPainted?.[blockY]?.[blockX]?.[cellY]?.[cellX]) ||
              Boolean(editorState.initialSolidite?.[blockY]?.[blockX]?.[cellY]?.[cellX]);
          }
        }
      }
    }
  }
  refreshEditor();
}

function isPrefabTerrainType(type: unknown): boolean {
  return String(type ?? "").startsWith("prefabTerrain");
}

function findPrefabStructureAtBlock(x: number, y: number): SandustryStructure | null {
  for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
    for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
      const structure = api.structures.getAtCell?.(x + cellX, y + cellY);
      if (structure && isPrefabTerrainType(structure.type)) {
        return structure;
      }
    }
  }
  const stored = Object.values(
    (engine.state as unknown as { store?: { structures?: Record<string, SandustryStructure> } })
      .store?.structures ?? {},
  ).find(
    (structure) =>
      structure &&
      isPrefabTerrainType(structure.type) &&
      structure.x >= x &&
      structure.x < x + CELLS_PER_BLOCK &&
      structure.y >= y &&
      structure.y < y + CELLS_PER_BLOCK,
  );
  if (stored) return stored;
  return null;
}

function readPrefabCellIds(existing: SandustryStructure, x: number, y: number): number[][] {
  const definition = (
    existing.data as
      | { __prefabulatorBlueprint?: { definition?: { cellIds?: number[][] } } }
      | undefined
  )?.__prefabulatorBlueprint?.definition;
  if (
    definition?.cellIds?.length === CELLS_PER_BLOCK &&
    definition.cellIds.every(
      (row) =>
        row.length === CELLS_PER_BLOCK &&
        row.every((cellId) => Number.isInteger(cellId) && cellId >= 0),
    )
  ) {
    return definition.cellIds.map((row) => row.slice());
  }
  return Array.from({ length: CELLS_PER_BLOCK }, (_, cellY) =>
    Array.from({ length: CELLS_PER_BLOCK }, (_, cellX) => {
      const cellId = api.world.getCellIdAtCell(x + cellX, y + cellY);
      return Number.isInteger(cellId) && cellId !== 0 && api.terrains.isCellIdTerrain(cellId)
        ? cellId
        : 0;
    }),
  );
}

function mergeWithExistingPrefab(x: number, y: number, painted: boolean[][]): number[][] | null {
  const existing = findPrefabStructureAtBlock(x, y);
  if (!existing) return null;

  const cellIds = readPrefabCellIds(existing, x, y);
  const existingCellId =
    cellIds.flat().find((cellId) => cellId === PREFAB_CELL_ID) ?? PREFAB_CELL_ID;
  for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
    for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
      cellIds[cellY][cellX] = painted[cellY][cellX] ? existingCellId : 0;
    }
  }
  return cellIds;
}

function applyPrefabPattern(): void {
  if (!editorState) return;
  const placements: Array<{
    x: number;
    y: number;
    data: Record<string, unknown>;
    existing: SandustryStructure | null;
  }> = [];
  const prefabRemovals: SandustryStructure[] = [];
  const soliditePlacements: Array<{ x: number; y: number }> = [];
  const soliditeRemovals: Array<{ x: number; y: number }> = [];
  for (let blockY = 0; blockY < GRID_SIZE; blockY += 1) {
    for (let blockX = 0; blockX < GRID_SIZE; blockX += 1) {
      const painted = editorState.painted[blockY][blockX];
      const x = editorState.originX + blockX * CELLS_PER_BLOCK;
      const y = editorState.originY + blockY * CELLS_PER_BLOCK;
      const solidite = editorState.solidite[blockY][blockX];
      let prefabChanged = false;
      for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
        for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
          const dirty = editorState.dirty?.[blockY]?.[blockX]?.[cellY]?.[cellX] ?? true;
          if (!dirty) continue;
          const initialPrefab = Boolean(
            editorState.initialPainted?.[blockY]?.[blockX]?.[cellY]?.[cellX],
          );
          const initialSolidite = Boolean(
            editorState.initialSolidite?.[blockY]?.[blockX]?.[cellY]?.[cellX] ??
            editorState.capturedSolidite?.[blockY]?.[blockX]?.[cellY]?.[cellX],
          );
          if (!editorState.initialPainted || painted[cellY][cellX] !== initialPrefab) {
            prefabChanged = true;
          }
          if (solidite[cellY][cellX] && !initialSolidite) {
            soliditePlacements.push({ x: x + cellX, y: y + cellY });
          } else if (!solidite[cellY][cellX] && initialSolidite) {
            soliditeRemovals.push({ x: x + cellX, y: y + cellY });
          }
        }
      }
      if (!prefabChanged) continue;
      const existingPrefab = findPrefabStructureAtBlock(x, y);
      if (painted.flat().some(Boolean) || existingPrefab) {
        const existingCellIds = existingPrefab ? mergeWithExistingPrefab(x, y, painted) : null;
        const cellIds =
          existingCellIds ?? painted.map((row) => row.map((cell) => (cell ? PREFAB_CELL_ID : 0)));
        if (cellIds.flat().some(Boolean)) {
          placements.push({
            x,
            y,
            data: {
              __prefabulatorBlueprint: {
                definition: {
                  shape: cellIds.map((row) =>
                    row.map((cellId) => (cellId === PREFAB_CELL_ID ? 1 : 0)),
                  ),
                  cellIds,
                },
              },
            },
            existing: existingPrefab,
          });
        } else if (existingPrefab) {
          prefabRemovals.push(existingPrefab);
        }
      }
    }
  }
  if (
    !placements.length &&
    !prefabRemovals.length &&
    !soliditePlacements.length &&
    !soliditeRemovals.length
  ) {
    api.ui.toast("Paint at least one cell before applying.");
    return;
  }
  if (
    (placements.length &&
      (typeof internalElementApi.elements?.removeAt !== "function" ||
        typeof internalStructureApi.structures?.build !== "function" ||
        typeof internalStructureApi.structures?.getConfig !== "function" ||
        typeof api.blueprints?.localizeStructures !== "function")) ||
    ((placements.some((placement) => placement.existing) || prefabRemovals.length > 0) &&
      typeof internalStructureApi.structures?.removeAt !== "function")
  ) {
    api.ui.toast("Autofabulator placement is unavailable.");
    return;
  }
  const place = () => {
    internalStructureApi.structures?.beginBatchWrite?.();
    try {
      for (const existing of [
        ...prefabRemovals,
        ...placements.flatMap((placement) => (placement.existing ? [placement.existing] : [])),
      ]) {
        internalStructureApi.structures?.removeAt?.(engine.state, existing.x, existing.y, {
          removeCells: true,
        });
      }
      for (const target of soliditeRemovals) {
        removeTerrainImmediately(target.x, target.y);
      }
      // Prefabulator structures reject blocked placement. Clear each target
      // with the mutation API matching its current cell kind so the native
      // builder can register a non-queued structure and element bookkeeping
      // remains consistent.
      for (const placement of placements) {
        const cellIds = (
          placement.data.__prefabulatorBlueprint as {
            definition?: { cellIds?: number[][] };
          }
        ).definition?.cellIds;
        if (!cellIds) continue;
        for (let cellY = 0; cellY < CELLS_PER_BLOCK; cellY += 1) {
          for (let cellX = 0; cellX < CELLS_PER_BLOCK; cellX += 1) {
            if (cellIds[cellY]?.[cellX] === PREFAB_CELL_ID) {
              const cellXPosition = placement.x + cellX;
              const cellYPosition = placement.y + cellY;
              const cellId = api.world.getCellIdAtCell(cellXPosition, cellYPosition);
              if (cellId === 0) continue;
              if (api.terrains.isCellIdTerrain(cellId)) {
                removeTerrainImmediately(cellXPosition, cellYPosition);
              } else {
                internalElementApi.elements?.removeAt?.(engine.state, cellXPosition, cellYPosition);
              }
            }
          }
        }
      }
      for (const placement of placements) {
        const localized = api.blueprints.localizeStructures([
          {
            type: PREFAB_TERRAIN_TYPE,
            x: 0,
            y: 0,
            color: "#ffffff",
            data: placement.data,
          } as SandustryBlueprintRecord,
        ]);
        const localizedType = localized[0]?.type;
        if (typeof localizedType !== "string") continue;
        const structureConfig = internalStructureApi.structures?.getConfig?.(localizedType);
        if (!structureConfig) continue;
        const structure = internalStructureApi.structures?.build?.(
          engine.state,
          { x: placement.x, y: placement.y, clearance: BUILDING_CLEARANCE_AVAILABLE },
          localizedType,
          {
            data: placement.data,
            ignorePlayer: true,
            structureConfig: {
              ...structureConfig,
              structureType: localizedType,
              rejectWhenBlocked: false,
            },
          },
        );
        if (!structure || structure.queued) {
          console.warn(`[${MOD_ID}] native prefab placement failed at`, placement.x, placement.y);
          continue;
        }
      }
      for (const target of soliditePlacements) {
        replaceTerrainImmediately(target.x, target.y, "solidite");
      }
    } finally {
      internalStructureApi.structures?.endBatchWrite?.();
    }
  };
  const wasPaused = Boolean(
    (engine.state as unknown as { session?: { paused?: boolean } }).session?.paused,
  );
  setSimulationPaused(true);
  try {
    place();
  } finally {
    setSimulationPaused(wasPaused);
  }
  closeEditor();
}

function registerIntegrationApplyHook(): void {
  if (!(globalThis as Record<string, unknown>).__sandustryTestHost) return;
  const globals = globalThis as Record<string, unknown>;
  globals.__autofabulatorApply = (state: PainterEditorState) => {
    editorState = state;
    applyPrefabPattern();
  };
  onDispose(() => {
    delete globals.__autofabulatorApply;
  });
}

function AutofabulatorEditor() {
  if (!UIReact) return null;
  const [, bump] = UIReact.useState(0);
  UIReact.useEffect(() => {
    editorRepaint = bump;
    return () => {
      if (editorRepaint === bump) editorRepaint = null;
    };
  }, []);
  UIReact.useEffect(() => {
    const stopPaintingFromMouse = (event: MouseEvent) => {
      if (activePaintMode === "erase" && !event.isTrusted) return;
      stopPaintingGesture();
    };
    const stopPainting = () => stopPaintingGesture();
    const bridge = macRightMouseBridge();
    if (!nativeRightListenersRegistered && bridge) {
      nativeRightListenersRegistered = true;
      bridge.onPos?.((x, y) => {
        if (activePaintMode === "erase") paintEditorCellAtClientPoint(x, y);
      });
      bridge.onUp?.(() => {
        if (activePaintMode === "erase") stopPaintingGesture();
      });
    }
    window.addEventListener("mouseup", stopPaintingFromMouse, true);
    window.addEventListener("blur", stopPainting);
    document.addEventListener("visibilitychange", stopPainting);
    return () => {
      window.removeEventListener("mouseup", stopPaintingFromMouse, true);
      window.removeEventListener("blur", stopPainting);
      document.removeEventListener("visibilitychange", stopPainting);
    };
  }, []);
  UIReact.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !editorState) return;
      event.preventDefault();
      event.stopPropagation();
      closeEditor();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  if (!editorState) return null;
  const current = editorState;
  const stopPointerPainting = (event: PointerEvent) => {
    if (activePaintPointerId !== event.pointerId) return;
    stopPaintingGesture();
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.42)",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
      }}
      onContextMenu={(event: any) => event.preventDefault()}
      onClick={(event: any) => {
        if (event.target === event.currentTarget) closeEditor();
      }}
    >
      <div
        style={{
          width: "fit-content",
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "auto",
          boxSizing: "border-box",
          padding: 0,
          border: "1px solid #47505d",
          borderRadius: 4,
          background: "rgba(0, 0, 0, 0.75)",
          color: "#f5f1df",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(event: any) => event.stopPropagation()}
      >
        <div
          style={{
            minHeight: 32,
            boxSizing: "border-box",
            padding: "8px 16px",
            borderBottom: "1px solid #1e252e",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 11,
          }}
        >
          Autofabulator
        </div>
        <div style={{ padding: "12px 16px 14px" }}>
          <div style={{ color: "#aeb5c0", fontSize: 11, marginBottom: 10 }}>
            5×5 Blueprint Blocks · left-click prefab · middle-click Solidite · right-click erase
          </div>
          <div
            data-autofab-canvas
            onPointerDown={(event: any) => {
              if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
              const cell = cellAtClientPoint(event.clientX, event.clientY);
              if (!cell) return;
              event.preventDefault();
              event.stopPropagation();
              activePaintMode =
                event.button === 0 ? "prefab" : event.button === 1 ? "solidite" : "erase";
              activePaintPointerId = event.pointerId;
              activePaintCanvas = event.currentTarget;
              activePaintLastCell = null;
              event.currentTarget.setPointerCapture?.(event.pointerId);
              if (activePaintMode === "erase") startNativeRightMouseWatch();
              paintEditorCellElement(cell);
            }}
            onPointerMove={(event: any) => {
              if (activePaintMode === null || activePaintPointerId !== event.pointerId) return;
              const cell = cellAtClientPoint(event.clientX, event.clientY);
              if (!cell) return;
              event.preventDefault();
              event.stopPropagation();
              paintEditorCellElement(cell);
            }}
            onPointerUp={(event: any) => stopPointerPainting(event.nativeEvent)}
            onPointerCancel={(event: any) => stopPointerPainting(event.nativeEvent)}
            onLostPointerCapture={(event: any) => {
              if (activePaintMode === "erase" && nativeRightWatchOwned) return;
              stopPointerPainting(event.nativeEvent);
            }}
            onContextMenu={(event: any) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: CANVAS_SIZE,
              maxWidth: "100%",
              margin: "0 auto",
              aspectRatio: "1",
              gap: 0,
              padding: 0,
              background: "#090b0e",
              border: "1px solid #4c535e",
            }}
          >
            {current.painted.map((row, blockY) =>
              row.map((paintedBlock, blockX) => {
                const occupied = current.occupied[blockY][blockX];
                const isAnchor =
                  blockX === Math.floor(GRID_SIZE / 2) && blockY === Math.floor(GRID_SIZE / 2);
                return (
                  <button
                    key={`${blockX}:${blockY}`}
                    type="button"
                    aria-label={`block ${blockX + 1}, ${blockY + 1}`}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      padding: 0,
                      border: "1px solid #303740",
                      boxShadow: "none",
                      background: "#20252b",
                      cursor: "crosshair",
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${CELLS_PER_BLOCK}, 1fr)`,
                        width: "100%",
                        height: "100%",
                        opacity: 1,
                      }}
                    >
                      {occupied.flatMap((cellRow, cellY) =>
                        cellRow.map((cellOccupied, cellX) => (
                          <span
                            key={`${cellX}:${cellY}`}
                            data-autofab-cell={`${blockX}:${blockY}:${cellX}:${cellY}`}
                            style={{
                              background: cellOccupied
                                ? "#b7bec8"
                                : paintedBlock[cellY][cellX]
                                  ? "#dea61f"
                                  : current.solidite[blockY][blockX][cellY][cellX]
                                    ? "#d47735"
                                    : "transparent",
                              border: "1px solid rgba(130, 140, 150, 0.2)",
                              cursor: "crosshair",
                            }}
                          />
                        )),
                      )}
                    </span>
                    {isAnchor && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                        }}
                      >
                        <path
                          d="M 18 2 H 2 V 18 M 82 2 H 98 V 18 M 98 82 V 98 H 82 M 18 98 H 2 V 82"
                          fill="none"
                          stroke="#ffe14a"
                          strokeWidth="3"
                        />
                      </svg>
                    )}
                  </button>
                );
              }),
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10,
              justifyContent: "flex-end",
            }}
          >
            <button type="button" onClick={clearEditor} style={PANEL_BUTTON_STYLE}>
              Clear
            </button>
            <button type="button" onClick={closeEditor} style={PANEL_BUTTON_STYLE}>
              Cancel
            </button>
            <button type="button" onClick={applyPrefabPattern} style={ACCENT_BUTTON_STYLE}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function registerAutofabulator(): void {
  registerClickInterceptor();
  registerIntegrationApplyHook();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyF") nativePickerKeyActive = true;
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code === "KeyF") nativePickerKeyActive = false;
  };
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  onDispose(() => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    nativePickerKeyActive = false;
  });

  api.items.register({
    id: ITEM_ID,
    nameKey: "items|autofabulator|name",
    descriptionKey: "items|autofabulator|description",
    categoryKey: "utility",
    sprite: {
      id: TOOL_SPRITE_ID,
      type: "backhand",
    },
    handleAction: (state) => {
      if (state?.session?.action?.state?.[ACTION_START]) openEditor();
    },
    afterRender: (state) => {
      setMarqueeCursor(state);
      drawBlockHighlight(state);
    },
  });

  api.events.on("action:changed", () => {
    if (api.action?.getSelected()?.id !== ITEM_ID) {
      closeEditor();
      restoreCursor();
    }
  });

  api.events.on("game:ready", () => {
    // Keep the starter grant idempotent so reloads and existing saves never
    // duplicate the tool. A Conservatory purchase can replace this later if
    // the availability decision changes.
    grantAutofabulatorItem();
  });
}

async function initialize(): Promise<void> {
  api.i18n.register("en", TRANSLATIONS);

  await api.sprites.loadFromMod(TOOL_SPRITE_ID, "assets/autofabulator.png");
  registerAutofabulator();
}

initialize().catch((error) => console.error(`[${MOD_ID}] initialization failed:`, error));
