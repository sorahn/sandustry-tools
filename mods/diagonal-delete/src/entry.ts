/* Diagonal Delete: a separate native-backed structure deletion tool. */

"use strict";

const api = sandkit.api;
const engine = sandkit.engine;

const MOD_ID = "sorahn.sandustry-diagonal-delete";
const ITEM_ID = "diagonalDelete";
const ITEM_SPRITE_ID = "diagonalDeleteSprite";
const ACTION_START = 1;
const ACTION_ACTIVE = 2;
const ACTION_END = 3;
const TOOL_ITEM_TYPE = 2;
const GRID_COLOR = "red";
const GRID_FILL = "rgba(255, 0, 0, 0.05)";
const ANGLE_LOCK_ACQUIRE_DISTANCE = 5;
const ANGLE_LOCK_DIAGONAL_RELEASE_DISTANCE = 6;
const DELETE_MODE_KEY = `${MOD_ID}.mode`;

const TEXT = {
  "items|diagonalDelete|name": "Diagonal Delete",
  "items|diagonalDelete|description":
    "Delete structures along lines or parallelograms. Press Z during a drag to set the angle and add height.",
};

type Point = { x: number; y: number };
type DeleteMode = "free" | "angled";
type ShapeMode = "line" | "parallelogram";
type DragData = {
  start: Point;
  end: Point;
  lockedAngle: number | null;
  shapeMode: ShapeMode;
  baseEnd: Point | null;
};

const getSavedDeleteMode = (): DeleteMode => {
  try {
    const saved = api.storage.local.get(DELETE_MODE_KEY);
    return saved === "free" || saved === "angled" ? saved : "angled";
  } catch {
    return "angled";
  }
};

const rememberDeleteMode = (mode: DeleteMode): void => {
  try {
    api.storage.local.set(DELETE_MODE_KEY, mode);
  } catch {
    // Storage is optional across runtime versions.
  }
};

let deleteMode: DeleteMode = getSavedDeleteMode();

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

const snapCell = (point: Point, step: number): Point => ({
  x: Math.floor(point.x / step) * step,
  y: Math.floor(point.y / step) * step,
});

/** Return every grid anchor touched by the segment, including corner cells. */
const rasterizeLine = (start: Point, end: Point, supercover = false): Point[] => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);
  const stepX = deltaX < 0 ? -1 : 1;
  const stepY = deltaY < 0 ? -1 : 1;
  const points: Point[] = [];
  const seen = new Set<string>();

  const add = (point: Point) => {
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push(point);
  };

  if (!supercover) {
    let x = start.x;
    let y = start.y;
    let error = distanceX - distanceY;
    while (true) {
      add({ x, y });
      if (x === end.x && y === end.y) break;
      const doubledError = 2 * error;
      if (doubledError > -distanceY) {
        error -= distanceY;
        x += stepX;
      }
      if (doubledError < distanceX) {
        error += distanceX;
        y += stepY;
      }
    }
    return points;
  }

  let x = start.x;
  let y = start.y;
  let movedX = 0;
  let movedY = 0;
  add({ x, y });

  // Supercover traversal: when the ideal segment crosses a cell corner,
  // include both neighboring cells before advancing diagonally. This avoids
  // the gaps that ordinary Bresenham leaves in shallow and diagonal lines.
  while (movedX < distanceX || movedY < distanceY) {
    const horizontalProgress = (1 + 2 * movedX) * distanceY;
    const verticalProgress = (1 + 2 * movedY) * distanceX;
    if (horizontalProgress === verticalProgress) {
      add({ x: x + stepX, y });
      add({ x, y: y + stepY });
      x += stepX;
      y += stepY;
      movedX += 1;
      movedY += 1;
    } else if (horizontalProgress < verticalProgress) {
      x += stepX;
      movedX += 1;
    } else {
      y += stepY;
      movedY += 1;
    }
    add({ x, y });
  }

  return points;
};

const currentDrag = (state: SandustryEngineState): DragData | null => {
  const data = state.session.action?.customData;
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<DragData>;
  const start = asPoint(candidate.start);
  const end = asPoint(candidate.end);
  const lockedAngle =
    candidate.lockedAngle === null || candidate.lockedAngle === undefined
      ? null
      : Number.isFinite(candidate.lockedAngle)
        ? Number(candidate.lockedAngle)
        : null;
  const shapeMode = candidate.shapeMode === "parallelogram" ? "parallelogram" : "line";
  const baseEnd = asPoint(candidate.baseEnd);
  return start && end ? { start, end, lockedAngle, shapeMode, baseEnd } : null;
};

const setDrag = (state: SandustryEngineState, drag: DragData | null): void => {
  api.action?.setCustomData(drag ? { diagonalDelete: true, ...drag } : null);
};

const selectedTool = (): boolean => {
  try {
    return api.action?.getSelected?.()?.id === ITEM_ID;
  } catch {
    return false;
  }
};

const normalizeAngle = (angle: number): number => {
  let result = angle;
  while (result > 180) result -= 360;
  while (result <= -180) result += 360;
  return result;
};

const nearest45Angle = (deltaX: number, deltaY: number): number =>
  Math.round((Math.atan2(deltaY, deltaX) * 180) / Math.PI / 45) * 45;

const segmentAngle = (start: Point, end: Point, step: number): number | null => {
  const snappedStart = snapCell(start, step);
  const snappedEnd = snapCell(end, step);
  const deltaX = snappedEnd.x - snappedStart.x;
  const deltaY = snappedEnd.y - snappedStart.y;
  if (deltaX === 0 && deltaY === 0) return null;
  return normalizeAngle((Math.atan2(deltaY, deltaX) * 180) / Math.PI);
};

const constrainEndpoint = (
  start: Point,
  cursor: Point,
  step: number,
  previousLockedAngle: number | null,
  forceLock = false,
): { end: Point; lockedAngle: number | null } => {
  const snappedStart = snapCell(start, step);
  const snappedCursor = snapCell(cursor, step);
  const startX = Math.floor(snappedStart.x / step);
  const startY = Math.floor(snappedStart.y / step);
  const cursorX = Math.floor(snappedCursor.x / step);
  const cursorY = Math.floor(snappedCursor.y / step);
  const deltaX = cursorX - startX;
  const deltaY = cursorY - startY;
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  if ((!forceLock && deleteMode !== "angled") || distance === 0) {
    return { end: snappedCursor, lockedAngle: null };
  }

  const candidateAngle = nearest45Angle(deltaX, deltaY);
  const activeAngle = previousLockedAngle ?? candidateAngle;
  const isDiagonal = Math.abs(activeAngle) % 90 !== 0;
  const releaseDistance = isDiagonal
    ? ANGLE_LOCK_DIAGONAL_RELEASE_DISTANCE
    : ANGLE_LOCK_ACQUIRE_DISTANCE;

  // Match native placement's hysteresis: acquire after a short drag, then
  // keep the direction until the cursor comes back close to the origin.
  if (!forceLock && previousLockedAngle === null && distance <= ANGLE_LOCK_ACQUIRE_DISTANCE) {
    return { end: snappedCursor, lockedAngle: null };
  }
  if (previousLockedAngle !== null && distance <= releaseDistance) {
    return { end: snappedCursor, lockedAngle: null };
  }

  const radians = (activeAngle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const projectedDistance =
    Math.max(Math.abs(deltaX), Math.abs(deltaY)) / Math.max(Math.abs(cosine), Math.abs(sine));
  const constrainedX = Math.round(startX + cosine * projectedDistance);
  const constrainedY = Math.round(startY + sine * projectedDistance);
  return {
    end: { x: constrainedX * step, y: constrainedY * step },
    lockedAngle: normalizeAngle(activeAngle),
  };
};

const dragForCursor = (
  start: Point,
  cursor: Point,
  previousLockedAngle: number | null,
  forceLock = false,
): DragData => {
  const metrics = internalApi.rendering?.getGridMetrics?.() || api.rendering.getGridMetrics();
  const step = Math.max(1, Math.floor(metrics.snapGridCellSize || 1));
  const constrained = constrainEndpoint(start, cursor, step, previousLockedAngle, forceLock);
  return {
    start,
    end: constrained.end,
    lockedAngle: constrained.lockedAngle,
    shapeMode: "line",
    baseEnd: null,
  };
};

const isGridAlignedAngle = (angle: number): boolean => {
  const remainder = Math.abs(normalizeAngle(angle)) % 45;
  return remainder < 0.0001 || Math.abs(remainder - 45) < 0.0001;
};

const gridPathForDrag = (drag: DragData, step: number): Point[] => {
  const start = snapCell(drag.start, step);
  const end = snapCell(drag.end, step);
  const startGrid = { x: Math.floor(start.x / step), y: Math.floor(start.y / step) };

  if (drag.shapeMode !== "parallelogram" || !drag.baseEnd || drag.lockedAngle === null) {
    return rasterizeLine(startGrid, {
      x: Math.floor(end.x / step),
      y: Math.floor(end.y / step),
    });
  }

  const base = snapCell(drag.baseEnd, step);
  const baseEndGrid = { x: Math.floor(base.x / step), y: Math.floor(base.y / step) };
  // Exact cardinal/45-degree lines do not need corner expansion; keeping
  // those thin avoids turning the smallest diagonal parallelogram into a
  // three-cell net. Supercover remains enabled for arbitrary slopes.
  const basePath = rasterizeLine(startGrid, baseEndGrid, !isGridAlignedAngle(drag.lockedAngle));
  const cursorGrid = { x: Math.floor(end.x / step), y: Math.floor(end.y / step) };
  const cursorDeltaX = cursorGrid.x - baseEndGrid.x;
  const cursorDeltaY = cursorGrid.y - baseEndGrid.y;
  const horizontal = Math.abs(cursorDeltaX) >= Math.abs(cursorDeltaY);
  const offsetX = horizontal ? Math.sign(cursorDeltaX) : 0;
  const offsetY = horizontal ? 0 : Math.sign(cursorDeltaY);
  const height = horizontal ? Math.abs(cursorDeltaX) : Math.abs(cursorDeltaY);
  const result: Point[] = [];
  const seen = new Set<string>();
  for (let layer = 0; layer <= height; layer += 1) {
    for (const point of basePath) {
      const shifted = {
        x: point.x + offsetX * layer,
        y: point.y + offsetY * layer,
      };
      const key = `${shifted.x},${shifted.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(shifted);
    }
  }
  return result;
};

const drawAngleLockIndicator = (
  context: CanvasRenderingContext2D,
  state: SandustryEngineState,
  drag: DragData,
  step: number,
  cellSize: number,
): void => {
  if (drag.lockedAngle === null) return;

  const tileSize = cellSize * step;
  const start = snapCell(drag.start, step);
  const startDraw = internalApi.rendering?.getCellDrawPos?.(state, start.x, start.y);
  if (!startDraw) return;

  const centerX = startDraw.x + tileSize / 2;
  const centerY = startDraw.y + tileSize / 2;
  const angle = (drag.lockedAngle * Math.PI) / 180;
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const lockDistance = isGridAlignedAngle(drag.lockedAngle) ? 3 : 6;
  const radius = (lockDistance * tileSize) / Math.max(Math.abs(directionX), Math.abs(directionY));
  const lockX = centerX + directionX * radius;
  const lockY = centerY + directionY * radius;

  context.save();
  context.strokeStyle = "rgba(255, 0, 0, 0.35)";
  context.lineWidth = 2;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  context.stroke();
  context.setLineDash([]);

  // Match the native lock marker: a gold circular base with a dark body and
  // dark shackle, positioned at the locked-angle radius.
  const markerSize = 0.35 * tileSize;
  const markerWidth = markerSize;
  const markerHeight = 0.65 * markerSize;
  const bodyX = lockX - markerWidth / 2;
  const bodyY = lockY - 0.15 * markerHeight;
  const shackleRadius = 0.3 * markerSize;
  const baseRadius = shackleRadius + 0.5 * markerSize;
  const baseY = (bodyY - shackleRadius + bodyY + markerHeight) / 2;

  context.fillStyle = "rgb(255, 0, 0)";
  context.beginPath();
  context.arc(lockX, baseY, baseRadius, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "rgb(30, 30, 30)";
  context.strokeStyle = "rgb(30, 30, 30)";
  context.lineWidth = 0.15 * markerSize;
  context.beginPath();
  context.arc(lockX, bodyY, shackleRadius, Math.PI, 0);
  context.stroke();

  const inset = 0.1 * markerSize;
  context.beginPath();
  context.moveTo(bodyX + inset, bodyY);
  context.lineTo(bodyX + markerWidth - inset, bodyY);
  context.arcTo(bodyX + markerWidth, bodyY, bodyX + markerWidth, bodyY + inset, inset);
  context.lineTo(bodyX + markerWidth, bodyY + markerHeight - inset);
  context.arcTo(
    bodyX + markerWidth,
    bodyY + markerHeight,
    bodyX + markerWidth - inset,
    bodyY + markerHeight,
    inset,
  );
  context.lineTo(bodyX + inset, bodyY + markerHeight);
  context.arcTo(bodyX, bodyY + markerHeight, bodyX, bodyY + markerHeight - inset, inset);
  context.lineTo(bodyX, bodyY + inset);
  context.arcTo(bodyX, bodyY, bodyX + inset, bodyY, inset);
  context.closePath();
  context.fill();
  context.restore();
};

const removeAtPositions = (state: SandustryEngineState, positions: Point[]): void => {
  if (positions.length === 0) return;

  // The public batch API is backed by the native structures removal path. It
  // emits one `structures:removed` event for the selection, which is the event
  // consumed by the game's undo history. Keep the whole drag in one call so a
  // single Ctrl+Z restores the whole selection.
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

  // Compatibility fallback for runtimes that expose only the engine escape
  // hatch. This is still the native batched path and should also be undoable.
  const nativeRemove = internalApi.structures?.removeAtPositions;
  if (typeof nativeRemove === "function") {
    nativeRemove(state, positions, {
      removeCells: true,
      playSound: true,
    });
    return;
  }

  // Last-resort fallback. It is less efficient and may produce one undo entry
  // per cell on runtimes without either batched removal path.
  const publicRemove = (
    api.structures as typeof api.structures & {
      removeAtCellWhenIdle?: (x: number, y: number, options?: Record<string, unknown>) => void;
    }
  ).removeAtCellWhenIdle;
  if (typeof publicRemove !== "function") return;
  for (const position of positions) publicRemove(position.x, position.y, { removeCells: true });
};

const commitDrag = (state: SandustryEngineState, drag: DragData): void => {
  const metrics = internalApi.rendering?.getGridMetrics?.() || api.rendering.getGridMetrics();
  const step = Math.max(1, Math.floor(metrics.snapGridCellSize || 1));
  const gridPath = gridPathForDrag(drag, step);
  removeAtPositions(
    state,
    gridPath.map((point) => ({ x: point.x * step, y: point.y * step })),
  );
};

const drawPreview = (state: SandustryEngineState, drag: DragData): void => {
  const rendering = internalApi.rendering;
  if (!rendering?.withOverlayContext || !rendering.getCellDrawPos) return;

  const metrics = rendering.getGridMetrics();
  const step = Math.max(1, Math.floor(metrics.snapGridCellSize || 1));
  const path = gridPathForDrag(drag, step);
  const size = metrics.cellSize * step;

  rendering.withOverlayContext(state, (context) => {
    context.save();
    context.fillStyle = GRID_FILL;
    context.strokeStyle = GRID_COLOR;
    context.lineWidth = 1.5;
    for (const point of path) {
      const draw = rendering.getCellDrawPos(state, point.x * step, point.y * step);
      context.fillRect(draw.x, draw.y, size, size);
      context.strokeRect(draw.x + 0.5, draw.y + 0.5, size - 1, size - 1);
    }
    if (deleteMode === "angled") {
      drawAngleLockIndicator(context, state, drag, step, metrics.cellSize);
    }
    context.restore();
  });
};

const handleAction = (state: SandustryEngineState): void => {
  const actionState = state.session.action?.state;
  const cell = mouseCell(state);
  if (!cell) return;

  if (actionState?.[ACTION_START]) {
    const drag = dragForCursor(cell, cell, null);
    setDrag(state, drag);
    return;
  }

  const drag = currentDrag(state);
  if (!drag) return;

  if (actionState?.[ACTION_ACTIVE]) {
    if (drag.shapeMode === "parallelogram" && drag.baseEnd) {
      setDrag(state, { ...drag, end: cell });
    } else {
      setDrag(state, dragForCursor(drag.start, cell, drag.lockedAngle));
    }
    return;
  }

  if (actionState?.[ACTION_END]) {
    const finalDrag =
      drag.shapeMode === "parallelogram" && drag.baseEnd
        ? { ...drag, end: cell }
        : dragForCursor(drag.start, cell, drag.lockedAngle);
    commitDrag(state, finalDrag);
    setDrag(state, null);
  }
};

const registerItem = (): void => {
  const definition: SandustryItemDefinition = {
    id: ITEM_ID,
    itemType: TOOL_ITEM_TYPE,
    nameKey: "items|diagonalDelete|name",
    descriptionKey: "items|diagonalDelete|description",
    categoryKey: "utility",
    sprite: { id: ITEM_SPRITE_ID, type: "backhand" },
    handleAction,
    afterRender: (state) => {
      if (!selectedTool()) return;
      const drag = currentDrag(state);
      if (drag) drawPreview(state, drag);
    },
  };

  // Item definitions are keyed by ID, but register() also creates a new
  // mounted sprite each time. Update an existing definition in place during
  // reloads so repeated evaluation cannot create duplicate tool registrations.
  if (api.items.getDefinitionById(ITEM_ID)) {
    api.items.updateDefinition(ITEM_ID, definition);
  } else {
    api.items.register(definition);
  }

  api.input.registerBinding(`${MOD_ID}:cancel`, ["MouseRight"], {
    displayName: "Diagonal Delete",
    category: "utility",
    handlers: {
      down: () => {
        if (selectedTool()) api.action?.setCustomData(null);
      },
    },
  });

  api.input.registerBinding(`${MOD_ID}:mode`, ["KeyR"], {
    displayName: "Diagonal Delete Mode",
    category: "utility",
    handlers: {
      down: () => {
        if (!selectedTool()) return;
        deleteMode = deleteMode === "free" ? "angled" : "free";
        rememberDeleteMode(deleteMode);
        api.ui.toast(
          `Diagonal Delete: ${deleteMode === "free" ? "Free" : "Angled (90°/45°)"} mode`,
        );
      },
    },
  });

  api.input.registerBinding(`${MOD_ID}:parallelogram`, ["KeyZ"], {
    displayName: "Diagonal Delete Parallelogram",
    category: "utility",
    handlers: {
      down: () => {
        if (!selectedTool()) return;
        const state = engine.state;
        const drag = currentDrag(state);
        if (!drag) return;
        const cursor = mouseCell(state) || drag.end;
        if (drag.shapeMode === "parallelogram") {
          setDrag(state, dragForCursor(drag.start, cursor, null));
          api.ui.toast("Diagonal Delete: Line mode");
          return;
        }
        const base =
          deleteMode === "angled" && drag.lockedAngle !== null
            ? { ...drag }
            : dragForCursor(drag.start, cursor, null, deleteMode === "angled");
        const metrics = internalApi.rendering?.getGridMetrics?.() || api.rendering.getGridMetrics();
        const step = Math.max(1, Math.floor(metrics.snapGridCellSize || 1));
        const angle =
          deleteMode === "angled" ? base.lockedAngle : segmentAngle(drag.start, base.end, step);
        if (angle === null) return;
        setDrag(state, {
          ...base,
          lockedAngle: angle,
          shapeMode: "parallelogram",
          baseEnd: base.end,
        });
        api.ui.toast("Diagonal Delete: Parallelogram mode");
      },
    },
  });

  api.events.on("action:changed", () => {
    if (!selectedTool()) api.action?.setCustomData(null);
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
  await api.sprites.loadFromMod(ITEM_SPRITE_ID, "assets/diagonal-delete.png");
  registerItem();

  api.events.on("game:ready", () => {
    ensureSingleInventoryItem();
  });
};

initialize().catch((error) => console.error(`[${MOD_ID}] initialization failed:`, error));
