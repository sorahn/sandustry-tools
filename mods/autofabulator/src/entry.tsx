import { onDispose } from "../../../shared/dev-hmr";

const api = sandkit.api;

const MOD_ID = "sorahn.sandustry-autofabulator";
const ITEM_ID = "sorahnAutofabulator";
const TOOL_SPRITE_ID = "sorahnAutofabulatorSprite";
const EDITOR_ID = "sorahn-autofabulator-editor";
const GRID_SIZE = 5;
const CELLS_PER_BLOCK = 4;
const ACTION_START = "1";
const UIReact = sandkit.react ?? null;
let previousCursorStyle: unknown = null;
let marqueeCursorActive = false;

type OccupiedBlock = boolean[][];
type PainterEditorState = {
  originX: number;
  originY: number;
  painted: boolean[][];
  occupied: OccupiedBlock[][];
};

let editorState: PainterEditorState | null = null;
let editorRepaint: ((update: (value: number) => number) => void) | null = null;
let editorDispose: (() => void) | null = null;

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

function emptyPaintedGrid(): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
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

function paintEditorCell(blockX: number, blockY: number, painted: boolean): void {
  if (!editorState) return;
  editorState.painted[blockY][blockX] = painted;
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
        fontFamily: "system-ui, sans-serif",
      }}
      onContextMenu={(event: any) => event.preventDefault()}
      onClick={(event: any) => {
        if (event.target === event.currentTarget) closeEditor();
      }}
    >
      <div
        style={{
          width: 390,
          maxWidth: "calc(100vw - 32px)",
          padding: 16,
          border: "1px solid rgba(255, 210, 60, 0.72)",
          borderRadius: 8,
          background: "rgba(20, 24, 31, 0.98)",
          color: "#f5f1df",
          boxShadow: "0 0 28px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(event: any) => event.stopPropagation()}
      >
        <div style={{ fontSize: 18, marginBottom: 4 }}>Autofabulator</div>
        <div style={{ color: "#aeb5c0", fontSize: 12, marginBottom: 14 }}>
          5×5 Blueprint Blocks · left-click paint · right-click erase
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: 3,
            padding: 4,
            background: "#090b0e",
            border: "1px solid #4c535e",
          }}
        >
          {current.painted.map((row, blockY) =>
            row.map((painted, blockX) => {
              const occupied = current.occupied[blockY][blockX];
              return (
                <button
                  key={`${blockX}:${blockY}`}
                  type="button"
                  aria-label={`block ${blockX + 1}, ${blockY + 1}`}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    padding: 4,
                    border: painted ? "2px solid #ffe14a" : "1px solid #59616b",
                    background: painted ? "#151515" : "#20252b",
                    cursor: "crosshair",
                  }}
                  onClick={() => paintEditorCell(blockX, blockY, true)}
                  onContextMenu={(event: any) => {
                    event.preventDefault();
                    paintEditorCell(blockX, blockY, false);
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${CELLS_PER_BLOCK}, 1fr)`,
                      width: "100%",
                      height: "100%",
                      opacity: painted ? 0.18 : 1,
                    }}
                  >
                    {occupied.flatMap((cellRow, cellY) =>
                      cellRow.map((cellOccupied, cellX) => (
                        <span
                          key={`${cellX}:${cellY}`}
                          style={{
                            background: cellOccupied ? "#b7bec8" : "transparent",
                            border: "1px solid rgba(130, 140, 150, 0.2)",
                          }}
                        />
                      )),
                    )}
                  </span>
                </button>
              );
            }),
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button type="button" onClick={clearEditor}>
            Clear
          </button>
          <button type="button" onClick={closeEditor}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => api.ui.toast("Autofabulator placement is not implemented yet.")}
          >
            Apply
          </button>
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
    afterRender: (state) => setMarqueeCursor(state),
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
