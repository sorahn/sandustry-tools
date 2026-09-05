import { Button, buttonStyles, Select } from "@sandustry/ui";
import cx from "clsx";

export function BlueprintMapViewportControls({
  zoom,
  minZoom,
  maxZoom,
  measuredFitZoom,
  fitMode,
  pan,
  onExport,
  exportScale,
  onExportScaleChange,
  onZoomOut,
  onFit,
  onZoomIn,
}: {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  measuredFitZoom: number;
  fitMode: boolean;
  pan: { x: number; y: number };
  onExport: () => void;
  exportScale: number;
  onExportScaleChange: (scale: number) => void;
  onZoomOut: () => void;
  onFit: () => void;
  onZoomIn: () => void;
}) {
  return (
    <div
      className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded border border-slate-700/80 bg-slate-950/60 p-2 font-mono text-xs text-slate-300 shadow-lg backdrop-blur-sm"
      translate="no"
    >
      <Button
        type="button"
        className={cx(buttonStyles.compact, buttonStyles.noShift)}
        onClick={onExport}
      >
        Export PNG
      </Button>
      <label className="sr-only" htmlFor="blueprint-export-scale">
        Export resolution
      </label>
      <Select
        id="blueprint-export-scale"
        className="!min-h-0 !py-1 !px-2 text-xs"
        value={exportScale}
        onChange={(event) => onExportScaleChange(Number(event.target.value))}
      >
        <option value="1">1×</option>
        <option value="2">2×</option>
        <option value="4">4×</option>
      </Select>
      <span className="mr-1">{Number((zoom * 100).toFixed(1))}%</span>
      <Button
        type="button"
        className={cx(buttonStyles.compact, buttonStyles.noShift)}
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        aria-label="Zoom out"
      >
        −
      </Button>
      <Button
        type="button"
        className={cx(buttonStyles.compact, buttonStyles.noShift)}
        onClick={onFit}
        disabled={fitMode && zoom === measuredFitZoom && pan.x === 0 && pan.y === 0}
      >
        Fit
      </Button>
      <Button
        type="button"
        className={cx(buttonStyles.compact, buttonStyles.noShift)}
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        aria-label="Zoom in"
      >
        +
      </Button>
    </div>
  );
}
