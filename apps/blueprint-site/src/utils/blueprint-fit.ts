import {
  MAP_VIEWPORT_ASPECT_HEIGHT,
  MAP_VIEWPORT_ASPECT_WIDTH,
  MAP_VIEWPORT_BORDER_SIZE,
} from "./blueprint-map";

export type FitPolicy = {
  margin: { horizontal: number; vertical: number };
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

export type FitPolicyPreset = "default";
export type FitPolicySelection = FitPolicy | { preset: FitPolicyPreset };

export type FitInput = {
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type FitResult = {
  zoom: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  overflow: { horizontal: boolean; vertical: boolean };
};

export const DEFAULT_FIT_POLICY: FitPolicy = {
  // Preserve the current renderer's 24-cell combined margin at 8px per cell.
  // Policy margins are expressed in rendered map pixels, matching FitInput.
  margin: { horizontal: 96, vertical: 96 },
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
};

export function resolveFitPolicy(selection: FitPolicySelection): FitPolicy {
  return "preset" in selection ? FIT_POLICY_PRESETS[selection.preset] : selection;
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
  const fitWidth = input.contentWidth + policy.margin.horizontal * 2;
  const fitHeight = input.contentHeight + policy.margin.vertical * 2;
  const defaultHeight = aspectViewportHeight(input.viewportWidth, policy, input);
  const fitsDefaultViewport = fitWidth <= input.viewportWidth && fitHeight <= defaultHeight;
  const widthLimit =
    policy.fit.width === "required" ? input.viewportWidth / fitWidth : Number.POSITIVE_INFINITY;
  const heightLimit = defaultHeight / fitHeight;
  const useHeightConstraint =
    policy.zoom.selection !== "largest-width-fitting" &&
    policy.fit.height === "required" &&
    fitsDefaultViewport;
  const maxZoom = Math.min(
    policy.zoom.max,
    widthLimit,
    useHeightConstraint ? heightLimit : Number.POSITIVE_INFINITY,
  );
  const zoom = largestFittingZoom(
    policy.zoom.levels,
    useHeightConstraint ? maxZoom : Math.min(maxZoom, policy.zoom.fallbackMax),
    policy.zoom.min,
  );
  const contentWidthAtZoom = input.contentWidth * zoom;
  const horizontalCanvasGap = Math.max(0, (input.viewportWidth - contentWidthAtZoom) / 2);
  const requiredHeight =
    input.contentHeight * zoom + horizontalCanvasGap * 2 + MAP_VIEWPORT_BORDER_SIZE;
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
  const margin = policy.margin;
  const viewport = policy.viewport;
  const zoom = policy.zoom;
  const fit = policy.fit;
  return Boolean(
    margin &&
    Number.isFinite(margin.horizontal) &&
    Number.isFinite(margin.vertical) &&
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
      (value as { preset?: unknown }).preset === "default")
  );
}
