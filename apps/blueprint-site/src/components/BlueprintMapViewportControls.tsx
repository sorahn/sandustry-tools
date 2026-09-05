import { Button, buttonStyles } from "@sandustry/ui";
import cx from "clsx";

export function BlueprintMapViewportControls({
  zoom,
  minZoom,
  maxZoom,
  measuredFitZoom,
  fitMode,
  pan,
  onExport,
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
      <span className="mr-1">{Number((zoom * 100).toFixed(1))}%</span>
      <Button
        type="button"
        className={cx(
          buttonStyles.compact,
          buttonStyles.noShift,
          "focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none",
        )}
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        aria-label="Zoom out (-)"
        title="Zoom out (-)"
      >
        −
      </Button>
      <Button
        type="button"
        className={cx(
          buttonStyles.compact,
          buttonStyles.noShift,
          "focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none",
        )}
        onClick={onFit}
        disabled={fitMode && zoom === measuredFitZoom && pan.x === 0 && pan.y === 0}
        aria-label="Fit to viewport (0 or F)"
        title="Fit to viewport (0 or F)"
      >
        Fit
      </Button>
      <Button
        type="button"
        className={cx(
          buttonStyles.compact,
          buttonStyles.noShift,
          "focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none",
        )}
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        aria-label="Zoom in (+)"
        title="Zoom in (+)"
      >
        +
      </Button>
    </div>
  );
}
