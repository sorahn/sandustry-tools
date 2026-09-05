import type { BlueprintStructure, BlueprintType } from "./index.js";
import {
  type ElementCatalog,
  DEFAULT_ELEMENT_CATALOG,
  resolveElement,
  MATTER_TYPE,
} from "./element-catalog.js";
import type { PreparedBlueprint, PreparedStructure } from "./prepare.js";

export const HORIZONTAL_FILTER_TYPES = new Set<string | number>([
  17,
  "filterLeft",
  18,
  "filterRight",
  "filterLeftMk2",
  "filterRightMk2",
]);

export const VERTICAL_FILTER_TYPES = new Set<string | number>(["filterWall", "filterWallMk2"]);

export const FILTER_TYPES = new Set<string | number>([
  ...HORIZONTAL_FILTER_TYPES,
  ...VERTICAL_FILTER_TYPES,
]);

export const LEFT_FILTER_TYPES = new Set<string | number>([17, "filterLeft", "filterLeftMk2"]);

export const MK2_FILTER_TYPES = new Set<string | number>([
  "filterLeftMk2",
  "filterRightMk2",
  "filterWallMk2",
]);

export function isFilterStructure(type: BlueprintType): boolean {
  return FILTER_TYPES.has(type);
}

export function isHorizontalFilter(type: BlueprintType): boolean {
  return HORIZONTAL_FILTER_TYPES.has(type);
}

export function isVerticalFilter(type: BlueprintType): boolean {
  return VERTICAL_FILTER_TYPES.has(type);
}

export function isLeftFilter(type: BlueprintType): boolean {
  return LEFT_FILTER_TYPES.has(type);
}

export function normalizeElementList(value: unknown): number[] {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  const numbers = list
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num))
    .sort((a, b) => a - b);
  const deduped: number[] = [];
  for (let i = 0; i < numbers.length; i++) {
    if (i === 0 || numbers[i] !== numbers[i - 1]) {
      deduped.push(numbers[i]);
    }
  }
  return deduped;
}

export function canonicalizeFilterSignature(
  structure: BlueprintStructure,
  effectiveType: BlueprintType = structure.type,
): string {
  const filter = structure.filter;
  if (!filter) return `none_${effectiveType}`;

  const elementTypes = normalizeElementList(filter.elementType);
  const hasElementType = elementTypes.length > 0;
  const speedExempt = normalizeElementList(
    filter.speedExemptElementType ?? filter.speedExemptElementTypes,
  );
  const density =
    filter.density !== undefined && filter.density !== null ? String(filter.density) : "";
  const affectsLiquid = filter.affectsLiquid ? 1 : 0;
  const affectsGas = filter.affectsGas ? 1 : 0;
  const data = structure.data as Record<string, unknown> | undefined;
  const passThrough = data?.filterPassThrough ? 1 : 0;

  return [
    effectiveType,
    filter.mode ?? "",
    hasElementType ? 1 : 0,
    elementTypes.join(","),
    density,
    affectsLiquid,
    affectsGas,
    speedExempt.join(","),
    passThrough,
  ].join("_");
}

export type FilterClusterItem = {
  id?: number | string;
  name: string;
  color: string;
  matterType?: number;
};

export type FilterOverlayCluster = {
  key: string;
  structureType: BlueprintType;
  filterSignature: string;
  minCellX: number;
  minCellY: number;
  maxCellX: number;
  maxCellY: number;
  cellWidth: number;
  cellHeight: number;
  labelCellX: number;
  labelCellY: number;
  isVertical: boolean;
  isFilterLeft: boolean;
  mode?: "allow" | "block";
  hasFilter: boolean;
  elements: FilterClusterItem[];
  shouldUseAllowIconForPassThrough: boolean;
  members: PreparedStructure[];
};

export type ClusterFilterStructuresOptions = {
  elementCatalog?: ElementCatalog;
  gridSnap?: number;
};

export function clusterFilterStructures(
  preparedStructures: PreparedStructure[],
  options: ClusterFilterStructuresOptions = {},
): FilterOverlayCluster[] {
  const gridSnap = options.gridSnap ?? 4;
  const catalog = options.elementCatalog ?? DEFAULT_ELEMENT_CATALOG;

  const filterStructures = preparedStructures.filter((prepared) =>
    isFilterStructure(prepared.structure.type),
  );

  const horizontalGroups = new Map<string, PreparedStructure[]>();
  const verticalGroups = new Map<string, PreparedStructure[]>();

  for (const item of filterStructures) {
    const s = item.structure;
    const sig = canonicalizeFilterSignature(s);
    if (isVerticalFilter(s.type)) {
      const groupKey = `${Math.floor(s.x / gridSnap)}_${sig}`;
      let group = verticalGroups.get(groupKey);
      if (!group) {
        group = [];
        verticalGroups.set(groupKey, group);
      }
      group.push(item);
    } else {
      const groupKey = `${Math.floor(s.y / gridSnap)}_${sig}`;
      let group = horizontalGroups.get(groupKey);
      if (!group) {
        group = [];
        horizontalGroups.set(groupKey, group);
      }
      group.push(item);
    }
  }

  const clusters: FilterOverlayCluster[] = [];

  function buildCluster(run: PreparedStructure[], isVertical: boolean): FilterOverlayCluster {
    const first = run[0];
    const structure = first.structure;
    const filter = structure.filter;
    const rawElements = normalizeElementList(filter?.elementType);
    const hasFilter = rawElements.length > 0;
    const mode = filter?.mode === "block" ? "block" : "allow";

    let allGas = hasFilter;
    const elements: FilterClusterItem[] = rawElements.map((elType) => {
      const resolved = resolveElement(elType, catalog);
      if (resolved.matterType !== MATTER_TYPE.GAS) {
        allGas = false;
      }
      return {
        id: elType,
        name: resolved.name,
        color: resolved.color,
        matterType: resolved.matterType,
      };
    });

    const isFilterMk2 = MK2_FILTER_TYPES.has(structure.type);
    const shouldUseAllowIconForPassThrough = allGas && isFilterMk2;

    if (isVertical) {
      const minCellY = Math.min(...run.map((item) => item.structure.y));
      const maxCellY = Math.max(...run.map((item) => item.structure.y));
      const cellX = structure.x;
      const cellWidth = gridSnap;
      const cellHeight = maxCellY + gridSnap - minCellY;
      return {
        key: `v_${cellX}_${minCellY}_${structure.type}`,
        structureType: structure.type,
        filterSignature: canonicalizeFilterSignature(structure),
        minCellX: cellX,
        minCellY,
        maxCellX: cellX,
        maxCellY,
        cellWidth,
        cellHeight,
        labelCellX: cellX + cellWidth / 2,
        labelCellY: minCellY,
        isVertical: true,
        isFilterLeft: isLeftFilter(structure.type),
        mode,
        hasFilter,
        elements,
        shouldUseAllowIconForPassThrough,
        members: run,
      };
    } else {
      const minCellX = Math.min(...run.map((item) => item.structure.x));
      const maxCellX = Math.max(...run.map((item) => item.structure.x));
      const cellY = structure.y;
      const cellWidth = maxCellX + gridSnap - minCellX;
      const cellHeight = gridSnap;
      return {
        key: `h_${minCellX}_${cellY}_${structure.type}`,
        structureType: structure.type,
        filterSignature: canonicalizeFilterSignature(structure),
        minCellX,
        minCellY: cellY,
        maxCellX,
        maxCellY: cellY,
        cellWidth,
        cellHeight,
        labelCellX: minCellX + cellWidth / 2,
        labelCellY: cellY,
        isVertical: false,
        isFilterLeft: isLeftFilter(structure.type),
        mode,
        hasFilter,
        elements,
        shouldUseAllowIconForPassThrough,
        members: run,
      };
    }
  }

  horizontalGroups.forEach((group) => {
    group.sort((a, b) => a.structure.x - b.structure.x);
    let run: PreparedStructure[] = [];
    let lastCell = -Infinity;
    for (const item of group) {
      const cell = Math.floor(item.structure.x / gridSnap);
      if (cell <= lastCell + 1) {
        run.push(item);
      } else {
        if (run.length > 0) clusters.push(buildCluster(run, false));
        run = [item];
      }
      lastCell = cell;
    }
    if (run.length > 0) clusters.push(buildCluster(run, false));
  });

  verticalGroups.forEach((group) => {
    group.sort((a, b) => a.structure.y - b.structure.y);
    let run: PreparedStructure[] = [];
    let lastCell = -Infinity;
    for (const item of group) {
      const cell = Math.floor(item.structure.y / gridSnap);
      if (cell <= lastCell + 1) {
        run.push(item);
      } else {
        if (run.length > 0) clusters.push(buildCluster(run, true));
        run = [item];
      }
      lastCell = cell;
    }
    if (run.length > 0) clusters.push(buildCluster(run, true));
  });

  return clusters;
}

export const FILTER_CHIP_HEIGHT = 22;
export const CHAR_WIDTH = 6;
export const SWATCH_SIZE = 10;
export const ICON_SIZE = 16;
export const SECTION_GAP = 6;
export const INLINE_GAP = 3;
export const CHIP_PADDING_X = 5;

export function measureTextWidth(text: string): number {
  return text.length * CHAR_WIDTH;
}

export function measureFilterChip(cluster: FilterOverlayCluster): {
  width: number;
  height: number;
} {
  if (!cluster.hasFilter) {
    // None chip: padding(10) + swatch(10) + gap(3) + "None"(24) = 47
    return {
      width: CHIP_PADDING_X * 2 + SWATCH_SIZE + INLINE_GAP + measureTextWidth("None"),
      height: FILTER_CHIP_HEIGHT,
    };
  }

  // Elements section:
  // For each element: swatch(10) + gap(3) + nameWidth.
  // Separator between elements: ", " (12) + gap(3)*2
  let elementsWidth = 0;
  for (let i = 0; i < cluster.elements.length; i++) {
    if (i > 0) {
      elementsWidth += measureTextWidth(",") + INLINE_GAP;
    }
    elementsWidth += SWATCH_SIZE + INLINE_GAP + measureTextWidth(cluster.elements[i].name);
  }

  // Divider: 1px + gaps on each side (SECTION_GAP)
  const dividerWidth = 1 + SECTION_GAP * 2;

  // Others section: "Others"(36) + gap(3) + icon(16)
  const othersWidth = measureTextWidth("Others") + INLINE_GAP + ICON_SIZE;

  // Endpoint icon attached to elements section:
  const endpointIconWidth = INLINE_GAP + ICON_SIZE;

  const totalWidth =
    CHIP_PADDING_X * 2 + elementsWidth + endpointIconWidth + dividerWidth + othersWidth;

  return {
    width: Math.ceil(totalWidth),
    height: FILTER_CHIP_HEIGHT,
  };
}

export type PlacedFilterLabel = {
  cluster: FilterOverlayCluster;
  anchorX: number;
  anchorY: number;
  chipWidth: number;
  chipHeight: number;
  left: number;
  top: number;
  width: number;
  height: number;
  stemLength: number;
};

export type LayoutFilterLabelsOptions = {
  minX: number;
  minY: number;
  padding: number;
  paddingX: number;
  cell: number;
  labelScale?: number;
};

export function layoutFilterLabels(
  clusters: FilterOverlayCluster[],
  options: LayoutFilterLabelsOptions,
): PlacedFilterLabel[] {
  const { minX, minY, padding, paddingX, cell } = options;
  const scale = options.labelScale ?? 1.0;

  const placed: PlacedFilterLabel[] = [];

  // 1. Initial measurement and positioning
  for (const cluster of clusters) {
    const anchorX = (cluster.labelCellX - minX + paddingX) * cell;
    const anchorY = (cluster.labelCellY - minY + padding) * cell;

    const measured = measureFilterChip(cluster);
    const chipWidth = measured.width;
    const chipHeight = measured.height;

    const width = chipWidth * scale;
    const height = chipHeight * scale;

    const left = anchorX - width / 2;
    const baselineY = anchorY - 4 * scale;
    const top = baselineY - height;

    placed.push({
      cluster,
      anchorX,
      anchorY,
      chipWidth,
      chipHeight,
      left,
      top,
      width,
      height,
      stemLength: 0,
    });
  }

  // 2. Collision avoidance:
  // Sort from bottom to top (highest top coordinate descending), then left to right
  const sortedIndices = placed
    .map((_, index) => index)
    .sort((a, b) => {
      return placed[b].top - placed[a].top || placed[a].left - placed[b].left || a - b;
    });

  const settledIndices: number[] = [];

  for (const currentIdx of sortedIndices) {
    const current = placed[currentIdx];
    let candidateTop = current.top;
    let candidateBottom = candidateTop + current.height;
    const candidateLeft = current.left;
    const candidateRight = candidateLeft + current.width;

    let collided = true;
    let iterations = 0;

    while (collided && iterations < 50) {
      collided = false;
      iterations++;

      for (const settledIdx of settledIndices) {
        const other = placed[settledIdx];
        const otherLeft = other.left;
        const otherRight = otherLeft + other.width;
        const otherTop = other.top;
        const otherBottom = otherTop + other.height;

        const overlapsX = otherRight > candidateLeft && otherLeft < candidateRight;
        const overlapsY = otherBottom > candidateTop && otherTop < candidateBottom;

        if (overlapsX && overlapsY) {
          collided = true;
          // Shift current label up above other label with a 2px gap
          candidateTop = otherTop - current.height - 2 * scale;
          candidateBottom = candidateTop + current.height;
        }
      }
    }

    current.top = candidateTop;
    const baselineY = current.anchorY - 4 * scale;
    const finalBottom = candidateTop + current.height;
    current.stemLength = Math.max(0, baselineY - finalBottom);

    settledIndices.push(currentIdx);
  }

  return placed;
}

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
}

function numberFormat(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

const COLOR_ALLOW = "rgb(0, 255, 71)";
const COLOR_BLOCK = "#ef4444";
const COLOR_NONE = "#666666";

const DASHED_COLOR_ALLOW = "rgba(0, 255, 71, 0.8)";
const DASHED_COLOR_BLOCK = "rgba(239, 68, 68, 0.8)";
const DASHED_COLOR_NONE = "rgba(102, 102, 102, 0.8)";

function renderArrowDown(x: number, y: number, color: string): string {
  return `<svg x="${numberFormat(x)}" y="${numberFormat(y)}" width="16" height="16" viewBox="0 0 20 20" fill="${color}"><path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd"/></svg>`;
}

function renderArrowLeft(x: number, y: number, color: string): string {
  return `<svg x="${numberFormat(x)}" y="${numberFormat(y)}" width="16" height="16" viewBox="0 0 20 20" fill="${color}"><path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158-3.96a.75.75 0 1 0-1.04-1.08l-5.5 5.25a.75.75 0 0 0 0 1.08l5.5 5.25a.75.75 0 1 0 1.04-1.08l-4.158-3.96H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd"/></svg>`;
}

function renderArrowRight(x: number, y: number, color: string): string {
  return `<svg x="${numberFormat(x)}" y="${numberFormat(y)}" width="16" height="16" viewBox="0 0 20 20" fill="${color}"><path fill-rule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clip-rule="evenodd"/></svg>`;
}

function renderCheckCircle(x: number, y: number, color: string): string {
  return `<svg x="${numberFormat(x)}" y="${numberFormat(y)}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
}

function renderNoEntryCircle(x: number, y: number, color: string): string {
  return `<svg x="${numberFormat(x)}" y="${numberFormat(y)}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/></svg>`;
}

function renderChipContent(cluster: FilterOverlayCluster, width: number): string {
  const borderColor = !cluster.hasFilter
    ? COLOR_NONE
    : cluster.mode === "block"
      ? COLOR_BLOCK
      : COLOR_ALLOW;

  let innerSvg = `<rect width="${numberFormat(width)}" height="22" fill="rgba(0,0,0,0.85)" stroke="${borderColor}" stroke-width="1"/>`;

  if (!cluster.hasFilter) {
    let curX = CHIP_PADDING_X;
    // 10x10 swatch
    innerSvg += `<rect x="${numberFormat(curX)}" y="6" width="10" height="10" fill="#888888" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
    curX += SWATCH_SIZE + INLINE_GAP;
    innerSvg += `<text x="${numberFormat(curX)}" y="15" fill="#ffffff" font-size="10" font-family="ui-monospace,monospace" font-weight="500">None</text>`;
    return innerSvg;
  }

  // Build Elements Side
  function buildElementsSide(startX: number): { markup: string; width: number } {
    let curX = startX;
    let markup = "";
    for (let i = 0; i < cluster.elements.length; i++) {
      if (i > 0) {
        markup += `<text x="${numberFormat(curX)}" y="15" fill="#ffffff" font-size="10" font-family="ui-monospace,monospace">,</text>`;
        curX += measureTextWidth(",") + INLINE_GAP;
      }
      const el = cluster.elements[i];
      markup += `<rect x="${numberFormat(curX)}" y="6" width="10" height="10" fill="${escapeXml(el.color)}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
      curX += SWATCH_SIZE + INLINE_GAP;
      markup += `<text x="${numberFormat(curX)}" y="15" fill="#ffffff" font-size="10" font-family="ui-monospace,monospace" font-weight="500">${escapeXml(el.name)}</text>`;
      curX += measureTextWidth(el.name);
    }

    curX += INLINE_GAP;
    // Icon for elements side
    if (cluster.isVertical) {
      if (cluster.mode === "allow") {
        markup += renderCheckCircle(curX, 3, COLOR_ALLOW);
      } else {
        markup += renderNoEntryCircle(curX, 3, COLOR_BLOCK);
      }
    } else {
      if (cluster.mode === "allow") {
        if (cluster.shouldUseAllowIconForPassThrough) {
          markup += renderCheckCircle(curX, 3, COLOR_ALLOW);
        } else {
          markup += renderArrowDown(curX, 3, COLOR_ALLOW);
        }
      } else {
        if (cluster.shouldUseAllowIconForPassThrough) {
          markup += renderNoEntryCircle(curX, 3, COLOR_BLOCK);
        } else {
          markup += cluster.isFilterLeft
            ? renderArrowLeft(curX, 3, COLOR_BLOCK)
            : renderArrowRight(curX, 3, COLOR_BLOCK);
        }
      }
    }
    curX += ICON_SIZE;
    return { markup, width: curX - startX };
  }

  // Build Others Side
  function buildOthersSide(startX: number): { markup: string; width: number } {
    let curX = startX;
    let markup = "";
    markup += `<text x="${numberFormat(curX)}" y="15" fill="#ffffff" font-size="10" font-family="ui-monospace,monospace" font-weight="500">Others</text>`;
    curX += measureTextWidth("Others") + INLINE_GAP;

    if (cluster.isVertical) {
      if (cluster.mode === "allow") {
        markup += renderNoEntryCircle(curX, 3, COLOR_BLOCK);
      } else {
        markup += renderCheckCircle(curX, 3, COLOR_ALLOW);
      }
    } else {
      if (cluster.mode === "allow") {
        markup += cluster.isFilterLeft
          ? renderArrowLeft(curX, 3, COLOR_BLOCK)
          : renderArrowRight(curX, 3, COLOR_BLOCK);
      } else {
        markup += renderArrowDown(curX, 3, COLOR_ALLOW);
      }
    }
    curX += ICON_SIZE;
    return { markup, width: curX - startX };
  }

  // Determine section ordering
  let firstSide: "elements" | "others" = "elements";
  if (!cluster.isVertical) {
    if (cluster.mode === "allow") {
      firstSide = cluster.isFilterLeft ? "others" : "elements";
    } else {
      firstSide = cluster.isFilterLeft ? "elements" : "others";
    }
  }

  let curX = CHIP_PADDING_X;
  if (firstSide === "elements") {
    const s1 = buildElementsSide(curX);
    innerSvg += s1.markup;
    curX += s1.width + SECTION_GAP;
    // Divider
    innerSvg += `<rect x="${numberFormat(curX)}" y="4" width="1" height="14" fill="rgba(255,255,255,0.2)"/>`;
    curX += 1 + SECTION_GAP;
    const s2 = buildOthersSide(curX);
    innerSvg += s2.markup;
  } else {
    const s1 = buildOthersSide(curX);
    innerSvg += s1.markup;
    curX += s1.width + SECTION_GAP;
    // Divider
    innerSvg += `<rect x="${numberFormat(curX)}" y="4" width="1" height="14" fill="rgba(255,255,255,0.2)"/>`;
    curX += 1 + SECTION_GAP;
    const s2 = buildElementsSide(curX);
    innerSvg += s2.markup;
  }

  return innerSvg;
}

export type FilterOverlayViewport = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Optional overscan margin in SVG units to prevent popping during pan (e.g. 64). */
  overscan?: number;
};

export type RenderFilterOverlaySvgOptions = {
  minX: number;
  minY: number;
  padding: number;
  paddingX: number;
  cell: number;
  labelScale?: number;
  elementCatalog?: ElementCatalog;
  /** When provided, granularly culls boundaries, stems, and chips outside this visible box. */
  viewport?: FilterOverlayViewport;
};

export function renderFilterOverlaySvg(
  preparedBlueprint: PreparedBlueprint,
  options: RenderFilterOverlaySvgOptions,
): string {
  const { minX, minY, padding, paddingX, cell } = options;
  const scale = options.labelScale ?? 1.0;

  const clusters = clusterFilterStructures(preparedBlueprint.preparedStructures, {
    elementCatalog: options.elementCatalog,
  });

  if (clusters.length === 0) return "";

  const labels = layoutFilterLabels(clusters, {
    minX,
    minY,
    padding,
    paddingX,
    cell,
    labelScale: scale,
  });

  const viewport = options.viewport;
  const overscan = viewport?.overscan ?? 0;
  const vMinX = viewport ? viewport.minX - overscan : -Infinity;
  const vMaxX = viewport ? viewport.maxX + overscan : Infinity;
  const vMinY = viewport ? viewport.minY - overscan : -Infinity;
  const vMaxY = viewport ? viewport.maxY + overscan : Infinity;
  const hasViewport = viewport !== undefined;

  // 1. Dashed boundaries around clusters
  let boundariesSvg = '<g class="blueprint-filter-boundaries">';
  for (const c of clusters) {
    const boxX = (c.minCellX - minX + paddingX) * cell;
    const boxY = (c.minCellY - minY + padding) * cell;
    const boxWidth = c.cellWidth * cell;
    const boxHeight = c.cellHeight * cell;

    if (
      hasViewport &&
      (boxX + boxWidth < vMinX || boxX > vMaxX || boxY + boxHeight < vMinY || boxY > vMaxY)
    ) {
      continue;
    }

    const boxColor = !c.hasFilter
      ? DASHED_COLOR_NONE
      : c.mode === "block"
        ? DASHED_COLOR_BLOCK
        : DASHED_COLOR_ALLOW;

    boundariesSvg += `<rect x="${numberFormat(boxX)}" y="${numberFormat(boxY)}" width="${numberFormat(boxWidth)}" height="${numberFormat(boxHeight)}" fill="none" stroke="${boxColor}" stroke-width="2" stroke-dasharray="4 3"/>`;
  }
  boundariesSvg += "</g>";

  // 2. Connector stems (for labels stacked upward)
  let stemsSvg = '<g class="blueprint-filter-stems">';
  for (const label of labels) {
    if (label.stemLength > 1) {
      const stemX = label.anchorX;
      const stemTop = label.top + label.height;
      const stemBottom = label.anchorY;

      if (
        hasViewport &&
        (stemX < vMinX ||
          stemX > vMaxX ||
          Math.max(stemTop, stemBottom) < vMinY ||
          Math.min(stemTop, stemBottom) > vMaxY)
      ) {
        continue;
      }

      stemsSvg += `<line x1="${numberFormat(stemX)}" y1="${numberFormat(stemTop)}" x2="${numberFormat(stemX)}" y2="${numberFormat(stemBottom)}" stroke="#000000" stroke-width="${numberFormat(Math.max(1, scale))}"/>`;
    }
  }
  stemsSvg += "</g>";

  // 3. Labels / Chips
  let labelsSvg = '<g class="blueprint-filter-labels">';
  for (const label of labels) {
    if (
      hasViewport &&
      (label.left + label.width < vMinX ||
        label.left > vMaxX ||
        label.top + label.height < vMinY ||
        label.top > vMaxY)
    ) {
      continue;
    }

    const chipSvg = renderChipContent(label.cluster, label.chipWidth);
    if (scale === 1) {
      labelsSvg += `<g transform="translate(${numberFormat(label.left)} ${numberFormat(label.top)})">${chipSvg}</g>`;
    } else {
      labelsSvg += `<g transform="translate(${numberFormat(label.left)} ${numberFormat(label.top)}) scale(${numberFormat(scale)})">${chipSvg}</g>`;
    }
  }
  labelsSvg += "</g>";

  return `<g class="blueprint-filter-overlay" pointer-events="none">${boundariesSvg}${stemsSvg}${labelsSvg}</g>`;
}
