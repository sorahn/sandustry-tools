import {
  MAP_VIEWPORT_ASPECT_HEIGHT,
  MAP_VIEWPORT_ASPECT_WIDTH,
  MAP_VIEWPORT_BORDER_SIZE,
} from "./blueprint-map";

export type FitSpacing = number | string;
export type FitGeometry = { padding: FitSpacing; margin: FitSpacing };
export type FitGrid = {
  extendToViewport: boolean;
};

export type FitPolicy = {
  geometry: FitGeometry;
  grid?: FitGrid;
  viewport: {
    orientation: "landscape" | "portrait" | "auto";
    aspect: { landscape: [number, number]; portrait: [number, number] };
    allowHeightGrowth: boolean;
    neverShrinkHeight: boolean;
  };
  zoom: {
    levels: readonly number[];
    min: number;
    max: number;
    fallbackMax: number;
    selection: "largest-fitting" | "largest-width-fitting";
  };
  fit: {
    width: "required" | "preferred";
    height: "required" | "preferred";
  };
  anchor: "center" | "top" | "top-left";
};

export type FitPolicyPreset = "default" | "vault" | "test";
export type FitPolicySelection = FitPolicy | { preset: FitPolicyPreset };

export type FitInput = {
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  marginPx: number;
};

export type FitResult = {
  zoom: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  overflow: { horizontal: boolean; vertical: boolean };
};

export const DEFAULT_FIT_POLICY: FitPolicy = {
  geometry: { padding: 6, margin: 6 },
  grid: { extendToViewport: true },
  viewport: {
    orientation: "landscape",
    aspect: {
      landscape: [MAP_VIEWPORT_ASPECT_WIDTH, MAP_VIEWPORT_ASPECT_HEIGHT],
      portrait: [MAP_VIEWPORT_ASPECT_HEIGHT, MAP_VIEWPORT_ASPECT_WIDTH],
    },
    allowHeightGrowth: true,
    neverShrinkHeight: true,
  },
  zoom: {
    levels: [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4],
    min: 0.25,
    max: 2,
    fallbackMax: 1,
    selection: "largest-fitting",
  },
  fit: { width: "required", height: "required" },
  anchor: "center",
};

export const FIT_POLICY_PRESETS: Record<FitPolicyPreset, FitPolicy> = {
  default: DEFAULT_FIT_POLICY,
  vault: {
    ...DEFAULT_FIT_POLICY,
    geometry: { ...DEFAULT_FIT_POLICY.geometry, padding: 4 },
    grid: { extendToViewport: true },
    viewport: { ...DEFAULT_FIT_POLICY.viewport, allowHeightGrowth: false },
    zoom: {
      ...DEFAULT_FIT_POLICY.zoom,
      levels: [0.125, ...DEFAULT_FIT_POLICY.zoom.levels],
      min: 0.125,
    },
  },
  test: {
    ...DEFAULT_FIT_POLICY,
  },
};

export function resolveFitPolicy(selection: FitPolicySelection): FitPolicy {
  return "preset" in selection ? FIT_POLICY_PRESETS[selection.preset] : selection;
}

export function resolveFitSpacing(value: FitSpacing, cellSize: number, reference?: HTMLElement) {
  if (typeof value === "number") return value * cellSize;
  if (!reference || typeof document === "undefined") {
    const pixels = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))px$/i);
    if (pixels) return Number(pixels[1]);
    if (value.trim() === "0") return 0;
    return 0;
  }
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = value;
  reference.appendChild(probe);
  const resolved = probe.getBoundingClientRect().width;
  probe.remove();
  return Number.isFinite(resolved) ? resolved : 0;
}

function aspectViewportHeight(width: number, policy: FitPolicy, input: FitInput) {
  const orientation =
    policy.viewport.orientation === "auto"
      ? input.viewportWidth >= input.viewportHeight
        ? "landscape"
        : "portrait"
      : policy.viewport.orientation;
  const [aspectWidth, aspectHeight] = policy.viewport.aspect[orientation];
  return width * (aspectHeight / aspectWidth) + MAP_VIEWPORT_BORDER_SIZE;
}

function largestFittingZoom(levels: readonly number[], maxZoom: number, minZoom: number) {
  return (
    levels
      .filter((level) => level >= minZoom && level <= maxZoom)
      .sort((a, b) => a - b)
      .at(-1) ?? minZoom
  );
}

export function solveInitialFit(input: FitInput, policy = DEFAULT_FIT_POLICY): FitResult {
  const fitWidth = input.contentWidth + input.marginPx * 2;
  const fitHeight = input.contentHeight + input.marginPx * 2;
  const defaultHeight = aspectViewportHeight(input.viewportWidth, policy, input);
  const widthLimit =
    policy.fit.width === "required" ? input.viewportWidth / fitWidth : Number.POSITIVE_INFINITY;
  const heightLimit = defaultHeight / fitHeight;
  const useHeightConstraint =
    policy.zoom.selection !== "largest-width-fitting" &&
    policy.fit.height === "required" &&
    !policy.viewport.allowHeightGrowth;
  const maxZoom = Math.min(
    policy.zoom.max,
    widthLimit,
    useHeightConstraint ? heightLimit : Number.POSITIVE_INFINITY,
  );
  const zoom = largestFittingZoom(
    policy.zoom.levels,
    useHeightConstraint || policy.viewport.allowHeightGrowth
      ? maxZoom
      : Math.min(maxZoom, policy.zoom.fallbackMax),
    policy.zoom.min,
  );
  // Height follows the fitted blueprint bounds and their minimum padding. Do
  // not reuse horizontal free space here: doing so makes the viewport height
  // track the blueprint's aspect ratio instead of its required footprint.
  const requiredHeight = fitHeight * zoom + MAP_VIEWPORT_BORDER_SIZE;
  const viewportHeight = policy.viewport.allowHeightGrowth
    ? policy.viewport.neverShrinkHeight
      ? Math.max(input.viewportHeight, defaultHeight, requiredHeight)
      : Math.max(defaultHeight, requiredHeight)
    : input.viewportHeight;

  return {
    zoom,
    viewportHeight,
    pan: { x: 0, y: 0 },
    overflow: {
      horizontal: fitWidth * zoom > input.viewportWidth,
      vertical: fitHeight * zoom > viewportHeight,
    },
  };
}

export function isFitPolicy(value: unknown): value is FitPolicy {
  if (!value || typeof value !== "object") return false;
  const policy = value as Partial<FitPolicy>;
  const geometry = policy.geometry;
  const grid = policy.grid;
  const viewport = policy.viewport;
  const zoom = policy.zoom;
  const fit = policy.fit;
  return Boolean(
    geometry &&
    [geometry.padding, geometry.margin].every(
      (spacing) =>
        (typeof spacing === "number" && Number.isFinite(spacing)) ||
        (typeof spacing === "string" && spacing.trim().length > 0),
    ) &&
    (!grid || typeof grid.extendToViewport === "boolean") &&
    viewport &&
    ["landscape", "portrait", "auto"].includes(viewport.orientation ?? "") &&
    Array.isArray(viewport.aspect?.landscape) &&
    Array.isArray(viewport.aspect?.portrait) &&
    typeof viewport.allowHeightGrowth === "boolean" &&
    typeof viewport.neverShrinkHeight === "boolean" &&
    zoom &&
    Array.isArray(zoom.levels) &&
    zoom.levels.length > 0 &&
    zoom.levels.every((level) => typeof level === "number" && Number.isFinite(level)) &&
    Number.isFinite(zoom.min) &&
    Number.isFinite(zoom.max) &&
    Number.isFinite(zoom.fallbackMax) &&
    ["largest-fitting", "largest-width-fitting"].includes(zoom.selection ?? "") &&
    fit &&
    ["required", "preferred"].includes(fit.width ?? "") &&
    ["required", "preferred"].includes(fit.height ?? "") &&
    ["center", "top", "top-left"].includes(policy.anchor ?? "") &&
    Array.isArray(viewport.aspect?.landscape) &&
    viewport.aspect.landscape.length === 2 &&
    viewport.aspect.landscape.every((value) => typeof value === "number" && value > 0) &&
    Array.isArray(viewport.aspect?.portrait) &&
    viewport.aspect.portrait.length === 2 &&
    viewport.aspect.portrait.every((value) => typeof value === "number" && value > 0),
  );
}

export function isFitPolicySelection(value: unknown): value is FitPolicySelection {
  return (
    isFitPolicy(value) ||
    (Boolean(value) &&
      typeof value === "object" &&
      typeof (value as { preset?: unknown }).preset === "string" &&
      Object.prototype.hasOwnProperty.call(
        FIT_POLICY_PRESETS,
        (value as { preset: string }).preset,
      ))
  );
}
