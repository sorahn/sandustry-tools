import { onDispose } from "../../../shared/dev-hmr";

const api = sandkit.api;
const engine = sandkit.engine;

const MOD_ID = "sorahn.sandustry-autofabulator";
const ITEM_ID = "sorahnAutofabulator";
const TOOL_SPRITE_ID = "sorahnAutofabulatorSprite";
const EDITOR_ID = "sorahn-autofabulator-editor";
const GRID_SIZE = 5;
const CELLS_PER_BLOCK = 4;
const CANVAS_SIZE = 360;
const ACTION_START = "1";
const UIReact = sandkit.react ?? null;
let previousCursorStyle: unknown = null;
let marqueeCursorActive = false;

type OccupiedBlock = boolean[][];
type PainterEditorState = {
  originX: number;
  originY: number;
  painted: boolean[][][][];
  occupied: OccupiedBlock[][];
};

let editorState: PainterEditorState | null = null;
let editorRepaint: ((update: (value: number) => number) => void) | null = null;
let editorDispose: (() => void) | null = null;

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

function isDevelopmentSession(): boolean {
  return Boolean((globalThis as Record<string, unknown>).__sandustryDevHmrConfig__);
}

function inventoryContains(): boolean {
  const inventory = sandkit.engine.state?.store?.player?.inventory;
  return Array.isArray(inventory) && inventory.some((item) => String(item?.id) === ITEM_ID);
}

function grantDevelopmentItem(): void {
  if (!isDevelopmentSession() || inventoryContains()) return;
  api.player.inventory.addFromId(ITEM_ID);
}

function setMarqueeCursor(state: SandustryEngineState): void {
  if (api.action?.getSelected()?.id !== ITEM_ID) {
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

function readOccupiedBlocks(originX: number, originY: number): OccupiedBlock[][] {
  return Array.from({ length: GRID_SIZE }, (_, blockY) =>
    Array.from({ length: GRID_SIZE }, (_, blockX) =>
      Array.from({ length: CELLS_PER_BLOCK }, (_, cellY) =>
        Array.from({ length: CELLS_PER_BLOCK }, (_, cellX) => {
          const x = originX + blockX * CELLS_PER_BLOCK + cellX;
          const y = originY + blockY * CELLS_PER_BLOCK + cellY;
          try {
            return api.world.isTerrainAtCell(x, y);
          } catch {
            return false;
          }
        }),
      ),
    ),
  );
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
  editorState = {
    originX,
    originY,
    painted: emptyPaintedGrid(),
    occupied: readOccupiedBlocks(originX, originY),
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
      if (editorState || api.action?.getSelected()?.id !== ITEM_ID) return;
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
  painted: boolean,
): void {
  if (!editorState) return;
  editorState.painted[blockY][blockX][cellY][cellX] = painted;
  refreshEditor();
}

function clearEditor(): void {
  if (!editorState) return;
  editorState.painted = emptyPaintedGrid();
  refreshEditor();
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
            5×5 Blueprint Blocks · left-click paint · right-click erase
          </div>
          <div
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
                            style={{
                              background: paintedBlock[cellY][cellX]
                                ? "#dea61f"
                                : cellOccupied
                                  ? "#b7bec8"
                                  : "transparent",
                              border: "1px solid rgba(130, 140, 150, 0.2)",
                              cursor: "crosshair",
                            }}
                            onClick={(event: any) => {
                              event.stopPropagation();
                              paintEditorCell(blockX, blockY, cellX, cellY, true);
                            }}
                            onContextMenu={(event: any) => {
                              event.preventDefault();
                              event.stopPropagation();
                              paintEditorCell(blockX, blockY, cellX, cellY, false);
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
            <button
              type="button"
              onClick={() => api.ui.toast("Autofabulator placement is not implemented yet.")}
              style={ACCENT_BUTTON_STYLE}
            >
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
    // TODO: replace this dev-only grant with a Conservatory ticket reward for
    // release. Keep the grant idempotent while the tool is being developed.
    grantDevelopmentItem();
  });
}

async function initialize(): Promise<void> {
  api.i18n.register("en", TRANSLATIONS);

  await api.sprites.loadFromMod(TOOL_SPRITE_ID, "assets/autofabulator.png");
  registerAutofabulator();
}

initialize().catch((error) => console.error(`[${MOD_ID}] initialization failed:`, error));
