export const DEFAULT_ZOOM_MIN = 0.125;
export const DEFAULT_ZOOM_MAX = 8;
export const DEFAULT_ZOOM_STEP_IN = 1.25;
export const DEFAULT_ZOOM_STEP_OUT = 0.8;
export const DEFAULT_WHEEL_IN = 1.15;
export const DEFAULT_WHEEL_OUT = 0.87;

const EPSILON = 0.001;
const SNAP_THRESHOLD = 0.02; // 2% magnetic snap window around 100%

export function roundZoom(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function isAt100(zoom: number): boolean {
  return Math.abs(zoom - 1) < EPSILON;
}

export type ZoomStepOptions = {
  multiplier?: number;
  min?: number;
  max?: number;
};

export type WheelZoomOptions = {
  inMultiplier?: number;
  outMultiplier?: number;
  min?: number;
  max?: number;
};

/**
 * Calculates the next zoom level stepping in (+), guaranteed to land exactly
 * on 100% (1.0) whenever zooming in from below 100% reaches or crosses it.
 */
export function stepZoomIn(current: number, options?: ZoomStepOptions): number {
  const multiplier = options?.multiplier ?? DEFAULT_ZOOM_STEP_IN;
  const max = options?.max ?? DEFAULT_ZOOM_MAX;

  // If already at 100%, step off cleanly from 1.0
  if (isAt100(current)) {
    return Math.min(max, roundZoom(1 * multiplier));
  }

  // If below 100%, land on 1.0 if crossing or reaching the snap window
  if (current < 1) {
    const candidate = current * multiplier;
    if (candidate >= 1 - SNAP_THRESHOLD) {
      return 1;
    }
    return roundZoom(Math.min(max, candidate));
  }

  // If above 100%
  return roundZoom(Math.min(max, current * multiplier));
}

/**
 * Calculates the next zoom level stepping out (−), guaranteed to land exactly
 * on 100% (1.0) whenever zooming out from above 100% drops to or crosses it.
 */
export function stepZoomOut(current: number, options?: ZoomStepOptions): number {
  const multiplier = options?.multiplier ?? DEFAULT_ZOOM_STEP_OUT;
  const min = options?.min ?? DEFAULT_ZOOM_MIN;

  // If already at 100%, step off cleanly from 1.0
  if (isAt100(current)) {
    return Math.max(min, roundZoom(1 * multiplier));
  }

  // If above 100%, land on 1.0 if crossing or reaching the snap window
  if (current > 1) {
    const candidate = current * multiplier;
    if (candidate <= 1 + SNAP_THRESHOLD) {
      return 1;
    }
    return roundZoom(Math.max(min, candidate));
  }

  // If below 100%
  return roundZoom(Math.max(min, current * multiplier));
}

/**
 * Calculates smooth wheel zoom, with a magnetic detent at 100% (1.0).
 * Any wheel zoom passing through or near 100% will pause at 1.0 for one event
 * before subsequent scrolls continue past it.
 */
export function wheelZoom(current: number, deltaY: number, options?: WheelZoomOptions): number {
  const min = options?.min ?? DEFAULT_ZOOM_MIN;
  const max = options?.max ?? DEFAULT_ZOOM_MAX;
  const inMultiplier = options?.inMultiplier ?? DEFAULT_WHEEL_IN;
  const outMultiplier = options?.outMultiplier ?? DEFAULT_WHEEL_OUT;

  if (deltaY < 0) {
    // Zooming in
    if (isAt100(current)) {
      return Math.min(max, roundZoom(1 * inMultiplier));
    }
    if (current < 1) {
      const candidate = current * inMultiplier;
      if (candidate >= 1 - SNAP_THRESHOLD) {
        return 1;
      }
      return roundZoom(Math.min(max, candidate));
    }
    return roundZoom(Math.min(max, current * inMultiplier));
  } else {
    // Zooming out
    if (isAt100(current)) {
      return Math.max(min, roundZoom(1 * outMultiplier));
    }
    if (current > 1) {
      const candidate = current * outMultiplier;
      if (candidate <= 1 + SNAP_THRESHOLD) {
        return 1;
      }
      return roundZoom(Math.max(min, candidate));
    }
    return roundZoom(Math.max(min, current * outMultiplier));
  }
}
