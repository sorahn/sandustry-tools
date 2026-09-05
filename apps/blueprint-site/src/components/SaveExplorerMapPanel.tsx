import { useEffect, useRef } from "react";
import { Button, TooltipSurface } from "@sandustry/ui";
import type { SaveExplorerCellInspection } from "@sandustry/save-core";

export type ExplorerRaster = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
};

export type ExplorerView = { scale: number; offsetX: number; offsetY: number };
export type ExplorerDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

type NullableRef<T> = { current: T | null };

type SaveExplorerMapPanelProps = {
  inputRef: NullableRef<HTMLInputElement>;
  canvasRef: NullableRef<HTMLCanvasElement>;
  mapFrameRef: NullableRef<HTMLDivElement>;
  dragRef: NullableRef<ExplorerDrag>;
  raster: ExplorerRaster | null;
  inspection: SaveExplorerCellInspection | null;
  hoverCell: { mapX: number; mapY: number } | null;
  hoverCellRef: NullableRef<{ mapX: number; mapY: number }>;
  view: ExplorerView;
  customCursor: boolean;
  dragging: boolean;
  busy: boolean;
  documentLoaded: boolean;
  message: string;
  onChooseFile: () => void;
  onFile: (file?: File) => void;
  onViewChange: (view: ExplorerView | ((current: ExplorerView) => ExplorerView)) => void;
  onHover: (cell: { mapX: number; mapY: number }) => void;
  onClearHover: () => void;
  onDraggingChange: (dragging: boolean) => void;
  fitMap: () => void;
  onInspect: (mapX: number, mapY: number) => void;
};

export function createDragDepthTracker(getOnDraggingChange: () => (dragging: boolean) => void) {
  let depth = 0;
  return {
    enter(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth += 1;
      if (depth === 1) {
        getOnDraggingChange()(true);
      }
    },
    leave(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        getOnDraggingChange()(false);
      }
    },
    drop(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth = 0;
      getOnDraggingChange()(false);
    },
    reset() {
      depth = 0;
    },
    get depth() {
      return depth;
    },
  };
}

export function SaveExplorerMapPanel({
  inputRef,
  canvasRef,
  mapFrameRef,
  dragRef,
  raster,
  inspection,
  hoverCell,
  hoverCellRef,
  view,
  customCursor,
  dragging,
  busy,
  documentLoaded,
  message,
  onChooseFile,
  onFile,
  onViewChange,
  onHover,
  onClearHover,
  onDraggingChange,
  fitMap,
  onInspect,
}: SaveExplorerMapPanelProps) {
  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;

  const trackerRef = useRef<ReturnType<typeof createDragDepthTracker> | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createDragDepthTracker(() => onDraggingChangeRef.current);
  }

  useEffect(() => {
    if (!dragging) {
      trackerRef.current?.reset();
    }
  }, [dragging]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className={`flex min-h-20 items-center justify-center gap-4 border-b p-4 transition-colors duration-150 ${
          dragging ? "border-yellow-400/70 bg-amber-900/30" : "border-slate-800/90 bg-slate-900/45"
        }`}
        onDragEnter={(event) => {
          trackerRef.current?.enter(event);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          trackerRef.current?.leave(event);
        }}
        onDrop={(event) => {
          trackerRef.current?.drop(event);
          void onFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".save"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <div className={`flex items-center gap-4 ${dragging ? "pointer-events-none" : ""}`}>
          <Button type="button" variant="solid" onClick={onChooseFile} disabled={busy}>
            {busy ? "Decoding…" : documentLoaded ? "Open another save" : "Choose save file"}
          </Button>
          <span className="text-xs text-slate-500">or drop a `.save` file</span>
        </div>
      </div>
      <div
        ref={mapFrameRef}
        className="relative flex flex-1 min-h-[min(65vh,42rem)] items-center justify-center overflow-hidden bg-black p-4 [touch-action:none] [overscroll-behavior:contain]"
        onWheel={(event) => {
          if (!raster) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const pointX = event.clientX - rect.left;
          const pointY = event.clientY - rect.top;
          const nextScale = Math.max(
            0.25,
            Math.min(8, view.scale * (event.deltaY < 0 ? 1.15 : 0.87)),
          );
          const mapX = (pointX - view.offsetX) / view.scale;
          const mapY = (pointY - view.offsetY) / view.scale;
          onViewChange({
            scale: nextScale,
            offsetX: pointX - mapX * nextScale,
            offsetY: pointY - mapY * nextScale,
          });
        }}
      >
        {raster ? (
          <canvas
            ref={canvasRef}
            className={`absolute block max-w-none select-none [image-rendering:pixelated] ${
              customCursor ? "cursor-none" : "cursor-grab active:cursor-grabbing"
            }`}
            aria-label="Save minimap"
            style={{
              width: raster.width * view.scale,
              height: raster.height * view.scale,
              left: view.offsetX,
              top: view.offsetY,
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: view.offsetX,
                offsetY: view.offsetY,
              };
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (drag && drag.pointerId === event.pointerId) {
                onViewChange((current) => ({
                  ...current,
                  offsetX: drag.offsetX + event.clientX - drag.startX,
                  offsetY: drag.offsetY + event.clientY - drag.startY,
                }));
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              const mapX = Math.floor((event.clientX - rect.left) / view.scale);
              const mapY = Math.floor((event.clientY - rect.top) / view.scale);
              const previous = hoverCellRef.current;
              if (previous?.mapX === mapX && previous.mapY === mapY) return;
              const nextCell = { mapX, mapY };
              hoverCellRef.current = nextCell;
              onHover(nextCell);
              onInspect(mapX, mapY);
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            onPointerLeave={() => {
              dragRef.current = null;
              hoverCellRef.current = null;
              onClearHover();
            }}
          />
        ) : (
          <div className="flex min-h-80 items-center justify-center p-8 text-center text-sm text-slate-500">
            {message}
          </div>
        )}
        {raster ? (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded border border-slate-600/85 bg-slate-950/80 p-2 font-mono text-[11px] text-slate-300 backdrop-blur-sm">
            <Button
              type="button"
              onClick={() =>
                onViewChange((current) => ({
                  ...current,
                  scale: Math.min(8, current.scale * 1.25),
                }))
              }
              aria-label="Zoom in"
            >
              +
            </Button>
            <span>{Math.round(view.scale * 100)}%</span>
            <Button
              type="button"
              onClick={() =>
                onViewChange((current) => ({
                  ...current,
                  scale: Math.max(0.25, current.scale * 0.8),
                }))
              }
              aria-label="Zoom out"
            >
              −
            </Button>
            <Button type="button" onClick={fitMap}>
              Fit
            </Button>
          </div>
        ) : null}
        {customCursor && hoverCell ? (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 border-2 border-yellow-400/95 bg-yellow-400/15 shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_0_10px_rgba(253,224,71,0.35)]"
            style={{
              left: view.offsetX + (hoverCell.mapX + 0.5) * view.scale,
              top: view.offsetY + (hoverCell.mapY + 0.5) * view.scale,
              width: Math.max(16, view.scale + 4),
              height: Math.max(16, view.scale + 4),
            }}
            aria-hidden="true"
          />
        ) : null}
        {hoverCell ? (
          <TooltipSurface
            className="pointer-events-none absolute z-10 whitespace-nowrap font-mono text-[11px] leading-snug"
            style={{
              left: view.offsetX + (hoverCell.mapX + 1) * view.scale + 12,
              top: view.offsetY + hoverCell.mapY * view.scale + 12,
            }}
          >
            {inspection ? (
              <>
                <div>
                  world {inspection.worldX},{inspection.worldY}
                </div>
                {inspection.revealed ? (
                  <>
                    <div>{inspection.kind ?? "unknown"}</div>
                    {inspection.type === undefined ? (
                      <div>unknown value</div>
                    ) : (
                      <div>
                        {inspection.name ?? "unknown"} (type {inspection.type})
                      </div>
                    )}
                    {inspection.terrainHp === undefined ? null : (
                      <div>terrain HP {inspection.terrainHp}</div>
                    )}
                    {inspection.particle === undefined ? null : (
                      <div>particle {inspection.particle ? "yes" : "no"}</div>
                    )}
                    {inspection.velocity ? (
                      <div>
                        velocity {inspection.velocity.x.toFixed(2)},{" "}
                        {inspection.velocity.y.toFixed(2)}
                      </div>
                    ) : null}
                    {inspection.structures?.length ? (
                      <div>
                        structures:{" "}
                        {inspection.structures
                          .map((structure) => structure.name ?? `type ${structure.type}`)
                          .join(", ")}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div>unrevealed</div>
                )}
              </>
            ) : (
              <div>inspecting…</div>
            )}
          </TooltipSurface>
        ) : null}
      </div>
      {raster ? (
        <div className="border-t border-slate-800 px-4 py-3 font-mono text-xs text-slate-500">
          {message} · {raster.width}×{raster.height} minimap pixels
        </div>
      ) : null}
    </div>
  );
}
