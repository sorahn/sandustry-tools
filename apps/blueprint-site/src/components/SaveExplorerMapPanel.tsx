import {
  Button,
  FileDropZone,
  LoadingOverlay,
  TooltipSurface,
  createDragDepthTracker,
} from "@sandustry/ui";
import type { SaveExplorerCellInspection } from "@sandustry/save-core";
import { stepZoomIn, stepZoomOut, wheelZoom } from "../utils/zoom";
import { MapViewportControls } from "./MapViewportControls";

export { createDragDepthTracker };

export type ExplorerRaster = {
  width: number;
  height: number;
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
  return (
    <div className="relative flex flex-1 h-full min-h-0 w-full flex-col overflow-hidden bg-black">
      {!documentLoaded ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <FileDropZone
            accept=".save"
            dragging={dragging}
            onDraggingChange={onDraggingChange}
            onFile={(file) => void onFile(file)}
            inputRef={inputRef}
            inputProps={{ className: "hidden" }}
            className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-800/90 bg-slate-950/70 p-8 text-center backdrop-blur transition-colors duration-150"
            activeClassName="border-yellow-400/70 bg-amber-900/30"
          >
            <div
              className={`flex flex-col items-center gap-3 ${dragging ? "pointer-events-none" : ""}`}
            >
              <div className="text-3xl">💾</div>
              <div className="font-semibold text-slate-200">No save loaded</div>
              <Button type="button" variant="solid" onClick={onChooseFile} disabled={busy}>
                {busy ? "Decoding…" : "Choose save file"}
              </Button>
              <span className="text-xs text-slate-400">or drop a `.save` file to begin</span>
            </div>
          </FileDropZone>
        </div>
      ) : (
        <FileDropZone
          accept=".save"
          dragging={dragging}
          onDraggingChange={onDraggingChange}
          onFile={(file) => void onFile(file)}
          inputRef={inputRef}
          inputProps={{ className: "hidden" }}
          className="absolute top-3 left-3 z-20 flex items-center gap-3 rounded border border-slate-800/90 bg-slate-950/80 p-1.5 font-mono text-xs text-slate-300 backdrop-blur-sm transition-colors duration-150"
          activeClassName="border-yellow-400/70 bg-amber-900/30"
        >
          <div className={`flex items-center gap-3 ${dragging ? "pointer-events-none" : ""}`}>
            <Button
              type="button"
              variant="solid"
              size="small"
              onClick={onChooseFile}
              disabled={busy}
            >
              {busy ? "Decoding…" : "Open another save"}
            </Button>
            <span className="hidden text-xs text-slate-400 sm:inline">or drop `.save`</span>
          </div>
        </FileDropZone>
      )}
      <div
        ref={mapFrameRef}
        tabIndex={0}
        role="region"
        aria-label="Save minimap viewport"
        className="relative flex flex-1 h-full min-h-0 w-full items-center justify-center overflow-hidden bg-black [touch-action:none] [overscroll-behavior:contain] focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none"
        onKeyDown={(event) => {
          if (!raster) return;
          if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            onViewChange((current) => ({
              ...current,
              scale: stepZoomIn(current.scale, { max: 8 }),
            }));
          } else if (event.key === "-" || event.key === "_") {
            event.preventDefault();
            onViewChange((current) => ({
              ...current,
              scale: stepZoomOut(current.scale, { min: 0.25 }),
            }));
          } else if (event.key === "0" || event.key.toLowerCase() === "f") {
            event.preventDefault();
            fitMap();
          }
        }}
        onWheel={(event) => {
          if (!raster) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const pointX = event.clientX - rect.left;
          const pointY = event.clientY - rect.top;
          const nextScale = wheelZoom(view.scale, event.deltaY, { min: 0.25, max: 8 });
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
          <MapViewportControls
            zoom={view.scale}
            minZoom={0.25}
            maxZoom={8}
            onZoomIn={() =>
              onViewChange((current) => ({
                ...current,
                scale: stepZoomIn(current.scale, { max: 8 }),
              }))
            }
            onZoomOut={() =>
              onViewChange((current) => ({
                ...current,
                scale: stepZoomOut(current.scale, { min: 0.25 }),
              }))
            }
            onFit={fitMap}
          />
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
        <LoadingOverlay busy={busy} message={message} data-testid="explorer-loading-overlay" />
      </div>
      <div className="border-t border-slate-800 px-4 py-3 font-mono text-xs text-slate-500">
        {raster ? `${message} · ${raster.width}×${raster.height} minimap pixels` : message}
      </div>
    </div>
  );
}
