import type { PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import { Button } from "@sandustry/ui";

export type MapViewportControlsProps = PropsWithChildren<{
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  measuredFitZoom?: number;
  fitMode?: boolean;
  pan?: { x: number; y: number };
  fitDisabled?: boolean;
  onFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onExport?: () => void;
  formatZoom?: (zoom: number) => string;
  className?: string;
  extraActions?: ReactNode;
}>;

export function MapViewportControls({
  zoom,
  minZoom = 0.125,
  maxZoom = 8,
  measuredFitZoom,
  fitMode,
  pan,
  fitDisabled: explicitFitDisabled,
  onFit,
  onZoomIn,
  onZoomOut,
  onExport,
  formatZoom,
  className,
  extraActions,
  children,
}: MapViewportControlsProps) {
  const isFitDisabled =
    explicitFitDisabled ??
    (Boolean(fitMode) &&
      measuredFitZoom !== undefined &&
      Math.abs(zoom - measuredFitZoom) < 0.001 &&
      (!pan || (pan.x === 0 && pan.y === 0)));

  return (
    <div
      className={cx(
        "absolute right-3 top-3 z-20 flex items-center gap-2 rounded border border-slate-700/80 bg-slate-950/60 p-2 font-mono text-xs text-slate-300 shadow-lg backdrop-blur-sm",
        className,
      )}
      translate="no"
    >
      {extraActions}
      {children}
      {onExport ? (
        <Button type="button" size="small" noShift onClick={onExport}>
          Export PNG
        </Button>
      ) : null}
      <span className="mr-1">
        {formatZoom ? formatZoom(zoom) : `${Number((zoom * 100).toFixed(1))}%`}
      </span>
      {onZoomOut ? (
        <Button
          type="button"
          size="small"
          noShift
          className="focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none"
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          aria-label="Zoom out (-)"
          title="Zoom out (-)"
        >
          −
        </Button>
      ) : null}
      {onFit ? (
        <Button
          type="button"
          size="small"
          noShift
          className="focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none"
          onClick={onFit}
          disabled={isFitDisabled}
          aria-label="Fit to viewport (0 or F)"
          title="Fit to viewport (0 or F)"
        >
          Fit
        </Button>
      ) : null}
      {onZoomIn ? (
        <Button
          type="button"
          size="small"
          noShift
          className="focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none"
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          aria-label="Zoom in (+)"
          title="Zoom in (+)"
        >
          +
        </Button>
      ) : null}
    </div>
  );
}

// Backward-compatible alias for existing imports
export const BlueprintMapViewportControls = MapViewportControls;
