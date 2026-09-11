import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import cx from "clsx";
import {
  prepareSvgForPng,
  renderPixelScale,
  renderBlueprintToSvg,
  renderFilterOverlaySvg,
  clusterFilterStructures,
  type FilterOverlayCluster,
  tileColor,
  structureLabel,
  NATIVE_PIXELS_PER_CELL,
  UNKNOWN_STRUCTURE_FOOTPRINT,
} from "@daryl.roberts/sandustry-blueprint-core";
import { type Blueprint } from "../utils/blueprint";
import { blueprintCatalog } from "../utils/catalog";
import { debugComponent } from "./DebugComponentWrapper";
import { MapDebugOptions } from "./MapDebugOptions";
import { BlueprintMapSidebar } from "./BlueprintMapSidebar";
import { BlueprintMapViewportControls } from "./BlueprintMapViewportControls";
import {
  BlueprintMapEdgeFadeLayer,
  BlueprintMapGridLayer,
  BlueprintMapRawStructuresLayer,
} from "./BlueprintMapLayers";
import { useBlueprintMapViewport } from "../hooks/useBlueprintMapViewport";
import {
  BLOCK_COORDINATE_SIZE,
  DISPLAY_PIXELS_PER_BLOCK_AT_100,
  MAP_ZOOM_LEVELS,
  MAP_VIEWPORT_BORDER_SIZE,
  viewportHeightForWidth,
  PAN_COMMIT_DEBOUNCE_MS,
  mapLayerStyle,
  readStoredMapView,
  snapMapZoom,
  createBlueprintMapModel,
  calculateMaxPan,
} from "../utils/blueprint-map";
import { stepZoomIn, stepZoomOut, wheelZoom, roundZoom } from "../utils/zoom";
import { readStoredBoolean, writeStorageValue, writeStoredBoolean } from "../utils/storage";
import {
  HIGHLIGHT_MATCHING_FILTERS_KEY,
  SAVED_MAP_VIEW_KEY,
  SHOW_CUSTOM_SHAPES_KEY,
  SHOW_DEBUG_CELLS_KEY,
  SHOW_FOUNDATION_OUTLINES_KEY,
  SHOW_NAMES_KEY,
  SHOW_RAW_STRUCTURES_KEY,
  SHOW_SIGNAL_LINKS_KEY,
  SHOW_SPRITES_KEY,
} from "../utils/storage-keys";
import { createBrowserPngPlatform, createImageResolver } from "../utils/png-platform";
import {
  resolveFitSpacing,
  solveInitialFit,
  type FitPolicy,
  type FitPolicyPreset,
  type FitSpacing,
} from "../utils/blueprint-fit";

const MAP_FIT_ZOOM_MIN = 0.25;
const MAP_FIT_ZOOM_MAX = 2;
const MAP_FIT_MARGIN_CELLS_TOTAL = 24;

export function BlueprintMap({
  blueprint,
  remember,
  blueprintKey,
  showSidebar,
  showGrid,
  showPngBackground,
  showFilters = false,
  captureOnly,
  showDebugOptions = true,
  fitPolicy,
  policySelection,
  onPolicySelectionChange,
  padding: paddingOverride,
  stickyTop,
  embedMode = false,
  onExportPng,
  fullHeight = false,
  selectedIndex: controlledSelectedIndex,
  onSelectedIndexChange,
  externalSidebar = false,
}: {
  blueprint: Blueprint;
  remember: boolean;
  blueprintKey: string;
  showSidebar: boolean;
  showGrid: boolean;
  showPngBackground: boolean;
  showFilters?: boolean;
  captureOnly?: boolean;
  showDebugOptions?: boolean;
  fitPolicy?: FitPolicy;
  policySelection?: "legacy" | FitPolicyPreset;
  onPolicySelectionChange?: (value: "legacy" | FitPolicyPreset) => void;
  padding?: FitSpacing;
  stickyTop?: string;
  embedMode?: boolean;
  onExportPng?: (png: ArrayBuffer, filename: string) => void;
  fullHeight?: boolean;
  selectedIndex?: number | null;
  onSelectedIndexChange?: (index: number | null) => void;
  externalSidebar?: boolean;
}) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState<number | null>(null);
  const selectedIndex =
    controlledSelectedIndex !== undefined ? controlledSelectedIndex : uncontrolledIndex;
  const setSelectedIndex = (
    indexOrFn: number | null | ((prev: number | null) => number | null),
  ) => {
    const next = typeof indexOrFn === "function" ? indexOrFn(selectedIndex) : indexOrFn;
    if (controlledSelectedIndex === undefined) {
      setUncontrolledIndex(next);
    }
    onSelectedIndexChange?.(next);
  };
  const [showDebugCells, setShowDebugCells] = useState(() =>
    readStoredBoolean(SHOW_DEBUG_CELLS_KEY, false),
  );
  const [showNames, setShowNames] = useState(() => readStoredBoolean(SHOW_NAMES_KEY, false));
  const [showSprites, setShowSprites] = useState(() => readStoredBoolean(SHOW_SPRITES_KEY, true));
  const [showCustomShapes, setShowCustomShapes] = useState(() =>
    readStoredBoolean(SHOW_CUSTOM_SHAPES_KEY, false),
  );
  const [showFoundationOutlines, setShowFoundationOutlines] = useState(() =>
    readStoredBoolean(SHOW_FOUNDATION_OUTLINES_KEY, true),
  );
  const [showSignalLinks, setShowSignalLinks] = useState(() =>
    readStoredBoolean(SHOW_SIGNAL_LINKS_KEY, true),
  );
  const [showRawStructures, setShowRawStructures] = useState(() =>
    readStoredBoolean(SHOW_RAW_STRUCTURES_KEY, false),
  );
  const exportScale = 1;
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(57);
  useEffect(() => {
    if (stickyTop !== undefined) return;
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const h = Math.round(entry.contentRect.height);
        if (h > 0) setSiteHeaderHeight((prev) => (prev !== h ? h : prev));
      }
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [stickyTop]);
  const [debugResetVersion, setDebugResetVersion] = useState<number | undefined>(undefined);
  const resetDebugOptions = () => {
    const defaults = [
      [SHOW_DEBUG_CELLS_KEY, false],
      [SHOW_NAMES_KEY, false],
      [SHOW_SPRITES_KEY, true],
      [SHOW_CUSTOM_SHAPES_KEY, false],
      [SHOW_FOUNDATION_OUTLINES_KEY, true],
      [SHOW_SIGNAL_LINKS_KEY, true],
      [SHOW_RAW_STRUCTURES_KEY, false],
    ] as const;
    for (const [key, value] of defaults) writeStoredBoolean(key, value);
    setShowDebugCells(false);
    setShowNames(false);
    setShowSprites(true);
    setShowCustomShapes(false);
    setShowFoundationOutlines(true);
    setShowSignalLinks(true);
    setShowRawStructures(false);
    setDebugResetVersion((version) => (version ?? 0) + 1);
  };
  useEffect(() => {
    if (debugResetVersion === undefined) return;
    setShowDebugCells(false);
    setShowNames(false);
    setShowSprites(true);
    setShowCustomShapes(false);
    setShowFoundationOutlines(true);
    setShowSignalLinks(true);
    setShowRawStructures(false);
  }, [debugResetVersion]);
  // Sprite hiding is a local renderer debugging aid. Keep the production
  // render path hard-wired to sprites regardless of persisted debug state.
  const spritesVisible = import.meta.env.PROD || showSprites;
  const foundationOutlinesVisible = import.meta.env.PROD || showFoundationOutlines;
  const signalLinksVisible = import.meta.env.PROD || showSignalLinks;
  const zoomLevels = fitPolicy?.zoom.levels ?? MAP_ZOOM_LEVELS;
  const minZoom = fitPolicy?.zoom.min ?? zoomLevels[0] ?? 0.125;
  const maxZoom = Math.max(8, fitPolicy?.zoom.max ?? zoomLevels[zoomLevels.length - 1] ?? 8);
  const [zoom, setZoom] = useState(() =>
    captureOnly ? 1 : (readStoredMapView(blueprintKey, zoomLevels)?.zoom ?? 1),
  );
  const [pan, setPan] = useState(() =>
    captureOnly
      ? { x: 0, y: 0 }
      : (readStoredMapView(blueprintKey, zoomLevels)?.pan ?? { x: 0, y: 0 }),
  );
  const [mapSizeReady, setMapSizeReady] = useState(
    () => captureOnly || readStoredMapView(blueprintKey, zoomLevels) !== null,
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const panCommitTimerRef = useRef<number | null>(null);
  const livePanRef = useRef(pan);
  const rafIdRef = useRef<number | null>(null);
  const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const previousSidebarVisibilityRef = useRef(showSidebar);
  const fitModeRef = useRef(
    captureOnly ? true : (readStoredMapView(blueprintKey, zoomLevels)?.fit ?? true),
  );
  // Blueprint coordinates are cell-sized units. Four native sprite pixels
  // make one cell, and four cells make one blueprint block. At 100% four
  // blueprint coordinates therefore render at 32 display pixels.
  const cell = DISPLAY_PIXELS_PER_BLOCK_AT_100 / NATIVE_PIXELS_PER_CELL;
  const policyPadding = fitPolicy?.geometry.padding ?? paddingOverride ?? 6;
  const policyMargin = fitPolicy?.geometry.margin ?? 12;
  const [resolvedPaddingPx, setResolvedPaddingPx] = useState<number>();
  const [resolvedMarginPx, setResolvedMarginPx] = useState<number>();
  const viewportGridEnabled = Boolean(fitPolicy?.grid?.extendToViewport);
  useLayoutEffect(() => {
    if (!fitPolicy) {
      setResolvedPaddingPx(undefined);
      setResolvedMarginPx(undefined);
      return;
    }
    const reference = document.body;
    setResolvedPaddingPx(resolveFitSpacing(policyPadding, cell, reference));
    setResolvedMarginPx(resolveFitSpacing(policyMargin, cell, reference));
  }, [cell, fitPolicy, policyMargin, policyPadding]);
  const padding = fitPolicy
    ? (resolvedPaddingPx ?? (typeof policyPadding === "number" ? policyPadding * cell : 6 * cell)) /
      cell
    : typeof paddingOverride === "number"
      ? paddingOverride
      : 6;
  const marginPx = fitPolicy
    ? (resolvedMarginPx ?? (typeof policyMargin === "number" ? policyMargin * cell : 12 * cell))
    : 12 * cell;
  const mapModel = useMemo(
    () => createBlueprintMapModel(blueprint, padding, cell),
    [blueprint, cell, padding],
  );
  const { preparedBlueprint, minX, minY, width, height } = mapModel;
  const baseRender = useMemo(
    () =>
      renderBlueprintToSvg(blueprint, {
        model: mapModel,
        catalog: blueprintCatalog(),
        assetBaseUrl: import.meta.env.BASE_URL,
        padding,
        cell,
        unknownFootprint: UNKNOWN_STRUCTURE_FOOTPRINT,
        includeBackground: false,
        showGrid: false,
        showSprites: spritesVisible,
        showCustomShapes,
        showNames,
        showFoundationOutlines: foundationOutlinesVisible,
        showSignalLinks: signalLinksVisible,
        showFilterOverlay: false,
      }),
    [
      blueprint,
      mapModel,
      cell,
      foundationOutlinesVisible,
      padding,
      showCustomShapes,
      showNames,
      showSprites,
      signalLinksVisible,
      spritesVisible,
    ],
  );

  const structureSpatialMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of mapModel.renderStructures) {
      const { index, structure } = item;
      const prepared = preparedBlueprint.preparedStructures[index];
      const footprintWidth = prepared.footprint.width;
      const footprintHeight = prepared.footprint.height;
      const topY = prepared.topY;
      for (let dx = 0; dx < footprintWidth; dx++) {
        for (let dy = 0; dy < footprintHeight; dy++) {
          map.set(`${structure.x + dx},${topY + dy}`, index);
        }
      }
    }
    return map;
  }, [mapModel.renderStructures, preparedBlueprint]);

  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const target = event.target as Element | null;
    const structureEl = target?.closest?.("[data-structure-index]");
    if (structureEl) {
      const idx = structureEl.getAttribute("data-structure-index");
      if (idx !== null) {
        setSelectedIndex(Number(idx));
        return;
      }
    }
    const svg = svgRef.current;
    if (!svg) return;
    const transform = svg.getScreenCTM();
    if (!transform) return;
    const pointer = svg.createSVGPoint();
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const local = pointer.matrixTransform(transform.inverse());
    const cellX = Math.floor(local.x / cell + minX - padding);
    const cellY = Math.floor(local.y / cell + minY - padding);
    const hit = structureSpatialMap.get(`${cellX},${cellY}`);
    setSelectedIndex(hit ?? null);
  };
  const { viewportRef, viewportSize, hoverMarkerRef, updateHoverBlock, clearHoverBlock } =
    useBlueprintMapViewport({ cell, minX, minY, padding, width, height });
  const viewportWidth = viewportRef.current?.clientWidth || viewportSize.width || width;
  const defaultViewportHeight = viewportHeightForWidth(viewportWidth);
  const legacyFitWidth = width + MAP_FIT_MARGIN_CELLS_TOTAL * cell;
  const legacyFitHeight = height + MAP_FIT_MARGIN_CELLS_TOTAL * cell;
  const legacyBlueprintFitsDefaultViewport =
    legacyFitWidth <= viewportWidth && legacyFitHeight <= defaultViewportHeight;
  const legacyFitZoomForViewport = (
    availableWidth: number,
    availableHeight = Number.POSITIVE_INFINITY,
    maxFitZoom = MAP_FIT_ZOOM_MAX,
  ) => {
    const maxZoom = Math.min(
      maxFitZoom,
      availableWidth / legacyFitWidth,
      availableHeight / legacyFitHeight,
    );
    return (
      MAP_ZOOM_LEVELS.filter(
        (level) => level >= MAP_FIT_ZOOM_MIN && level <= maxZoom,
      ).reverse()[0] ?? MAP_FIT_ZOOM_MIN
    );
  };
  const legacyMeasuredFitZoom = legacyBlueprintFitsDefaultViewport
    ? legacyFitZoomForViewport(viewportWidth, defaultViewportHeight)
    : legacyFitZoomForViewport(viewportWidth, Number.POSITIVE_INFINITY, 1);
  const legacyHorizontalCanvasGap = Math.max(
    0,
    (viewportWidth - width * legacyMeasuredFitZoom) / 2,
  );
  const legacyAspectRatioViewportHeight = legacyBlueprintFitsDefaultViewport
    ? defaultViewportHeight
    : Math.max(
        defaultViewportHeight,
        height * legacyMeasuredFitZoom + legacyHorizontalCanvasGap * 2 + MAP_VIEWPORT_BORDER_SIZE,
      );
  const currentViewportHeight =
    (fullHeight ? viewportRef.current?.clientHeight || viewportSize.height : 0) ||
    defaultViewportHeight;
  const measuredFitZoom = fitPolicy
    ? snapMapZoom(
        solveInitialFit(
          {
            contentWidth: width,
            contentHeight: height,
            viewportWidth,
            viewportHeight: currentViewportHeight,
            marginPx,
          },
          fitPolicy,
        ).zoom,
        zoomLevels,
      )
    : legacyMeasuredFitZoom;
  const aspectRatioViewportHeight = fitPolicy
    ? solveInitialFit(
        {
          contentWidth: width,
          contentHeight: height,
          viewportWidth,
          viewportHeight: currentViewportHeight,
          marginPx,
        },
        fitPolicy,
      ).viewportHeight
    : legacyAspectRatioViewportHeight;

  const { filterClusters, filterClusterByStructureIndex } = useMemo(() => {
    const clusters = clusterFilterStructures(preparedBlueprint.preparedStructures);
    const byIndex = new Map<number, FilterOverlayCluster>();
    for (const cluster of clusters) {
      for (const member of cluster.members) {
        byIndex.set(member.index, cluster);
      }
    }
    return { filterClusters: clusters, filterClusterByStructureIndex: byIndex };
  }, [preparedBlueprint]);

  const [highlightMatchingFilters, setHighlightMatchingFilters] = useState(() =>
    readStoredBoolean(HIGHLIGHT_MATCHING_FILTERS_KEY, false),
  );
  const handleHighlightMatchingFiltersChange = (value: boolean) => {
    setHighlightMatchingFilters(value);
    writeStoredBoolean(HIGHLIGHT_MATCHING_FILTERS_KEY, value);
  };

  const activeFilterCluster = useMemo(() => {
    if (selectedIndex === null) return null;
    return filterClusterByStructureIndex.get(selectedIndex) ?? null;
  }, [filterClusterByStructureIndex, selectedIndex]);

  const matchingFilterClusters = useMemo(() => {
    if (!activeFilterCluster) return [];
    return filterClusters.filter(
      (cluster) => cluster.filterConfigKey === activeFilterCluster.filterConfigKey,
    );
  }, [filterClusters, activeFilterCluster]);

  const matchingFiltersCount = useMemo(() => {
    return matchingFilterClusters.reduce((sum, cluster) => sum + cluster.members.length, 0);
  }, [matchingFilterClusters]);

  const shouldRenderFilterOverlay = showFilters || activeFilterCluster !== null;
  const filterOverlayLabelScale = shouldRenderFilterOverlay ? 1 / zoom : 1;
  const filterOverlayViewport = useMemo(() => {
    if (!shouldRenderFilterOverlay) return undefined;
    const viewW = viewportRef.current?.clientWidth || viewportSize.width || width;
    const viewH =
      viewportRef.current?.clientHeight || viewportSize.height || aspectRatioViewportHeight;
    const halfVisibleWidth = viewW / (2 * zoom);
    const halfVisibleHeight = viewH / (2 * zoom);
    return {
      minX: width / 2 + pan.x - halfVisibleWidth,
      maxX: width / 2 + pan.x + halfVisibleWidth,
      minY: height / 2 + pan.y - halfVisibleHeight,
      maxY: height / 2 + pan.y + halfVisibleHeight,
      overscan: 64,
    };
  }, [
    shouldRenderFilterOverlay,
    viewportRef,
    viewportSize.width,
    viewportSize.height,
    width,
    height,
    zoom,
    pan.x,
    pan.y,
    aspectRatioViewportHeight,
  ]);

  const filterOverlayMarkup = useMemo(() => {
    if (!shouldRenderFilterOverlay) return "";

    const clustersToRender = showFilters
      ? filterClusters
      : highlightMatchingFilters
        ? matchingFilterClusters
        : activeFilterCluster
          ? [activeFilterCluster]
          : undefined;

    const labelClusterKeys =
      !showFilters && highlightMatchingFilters && activeFilterCluster
        ? new Set([activeFilterCluster.key])
        : undefined;

    return renderFilterOverlaySvg(mapModel.preparedBlueprint, {
      minX: mapModel.minX,
      minY: mapModel.minY,
      padding: mapModel.padding,
      paddingX: mapModel.paddingX,
      cell: mapModel.cell,
      labelScale: filterOverlayLabelScale,
      viewport: filterOverlayViewport,
      clusters: clustersToRender,
      labelClusterKeys,
      activeClusterKey: activeFilterCluster?.key,
    });
  }, [
    shouldRenderFilterOverlay,
    showFilters,
    highlightMatchingFilters,
    matchingFilterClusters,
    mapModel,
    filterOverlayLabelScale,
    filterOverlayViewport,
    filterClusters,
    activeFilterCluster,
  ]);

  const currentViewWidth = viewportRef.current?.clientWidth || viewportSize.width || width;
  const currentViewHeight =
    (fullHeight ? viewportRef.current?.clientHeight || viewportSize.height : 0) ||
    defaultViewportHeight;
  const maxPanX = calculateMaxPan(width, currentViewWidth, zoom);
  const maxPanY = calculateMaxPan(height, currentViewHeight, zoom);
  const applyLivePan = (nextPan: { x: number; y: number }) => {
    pendingPanRef.current = nextPan;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const svg = svgRef.current;
        const pending = pendingPanRef.current;
        if (!svg || !pending) return;
        svg.style.transform = `translate3d(-50%, -50%, 0) translate3d(${-pending.x * zoom}px, ${-pending.y * zoom}px, 0)`;
      });
    }
  };
  const schedulePanCommit = () => {
    if (panCommitTimerRef.current !== null) {
      window.clearTimeout(panCommitTimerRef.current);
    }
    panCommitTimerRef.current = window.setTimeout(() => {
      panCommitTimerRef.current = null;
      setPan(livePanRef.current);
    }, PAN_COMMIT_DEBOUNCE_MS);
  };
  const gridOriginX = (padding - minX) * cell;
  const gridOriginY = (padding - minY) * cell;
  const selected = selectedIndex === null ? null : blueprint.data[selectedIndex];
  const debugOptions = debugComponent(MapDebugOptions, {
    showDebugCells,
    onShowDebugCellsChange: setShowDebugCells,
    showNames,
    onShowNamesChange: setShowNames,
    showSprites,
    onShowSpritesChange: setShowSprites,
    showCustomShapes,
    onShowCustomShapesChange: setShowCustomShapes,
    showFoundationOutlines,
    onShowFoundationOutlinesChange: setShowFoundationOutlines,
    showSignalLinks,
    onShowSignalLinksChange: setShowSignalLinks,
    showRawStructures,
    onShowRawStructuresChange: setShowRawStructures,
    resetVersion: debugResetVersion,
    onReset: resetDebugOptions,
    policySelection,
    onPolicySelectionChange,
  });
  useEffect(() => {
    const stored = remember && !captureOnly ? readStoredMapView(blueprintKey, zoomLevels) : null;
    fitModeRef.current = stored?.fit ?? true;
    const restoredZoom = captureOnly ? 1 : Math.max(minZoom, Math.min(maxZoom, stored?.zoom ?? 1));
    const restoreViewWidth = viewportSize.width || width;
    const restoreViewHeight =
      (fullHeight ? viewportRef.current?.clientHeight || viewportSize.height : 0) ||
      defaultViewportHeight;
    const restoredMaxPanX = calculateMaxPan(width, restoreViewWidth, restoredZoom);
    const restoredMaxPanY = calculateMaxPan(height, restoreViewHeight, restoredZoom);
    setZoom(restoredZoom);
    setPan(
      captureOnly
        ? { x: 0, y: 0 }
        : {
            x: Math.max(-restoredMaxPanX, Math.min(restoredMaxPanX, stored?.pan.x ?? 0)),
            y: Math.max(-restoredMaxPanY, Math.min(restoredMaxPanY, stored?.pan.y ?? 0)),
          },
    );
    setSelectedIndex(null);
    setMapSizeReady(
      captureOnly || (stored?.viewportWidth === viewportSize.width && viewportSize.width > 0),
    );
  }, [blueprint, blueprintKey, captureOnly]);
  const fitToLegacyViewport = () => {
    fitModeRef.current = true;
    const availableWidth = viewportRef.current?.clientWidth || viewportSize.width;
    const nextZoom = legacyBlueprintFitsDefaultViewport
      ? legacyFitZoomForViewport(
          availableWidth || width,
          viewportRef.current?.clientHeight || defaultViewportHeight,
        )
      : legacyFitZoomForViewport(availableWidth || width, Number.POSITIVE_INFINITY, 1);
    setZoom(nextZoom);
    setPan({ x: 0, y: 0 });
  };
  const fitToViewport = () => {
    if (!fitPolicy) {
      fitToLegacyViewport();
      return;
    }
    fitModeRef.current = true;
    const availableWidth = viewportRef.current?.clientWidth || viewportSize.width;
    setZoom(
      snapMapZoom(
        solveInitialFit(
          {
            contentWidth: width,
            contentHeight: height,
            viewportWidth: availableWidth || width,
            viewportHeight: viewportRef.current?.clientHeight || defaultViewportHeight,
            marginPx,
          },
          fitPolicy,
        ).zoom,
        zoomLevels,
      ),
    );
    setPan({ x: 0, y: 0 });
  };
  useLayoutEffect(() => {
    if (captureOnly) return;
    const sidebarVisibilityChanged = previousSidebarVisibilityRef.current !== showSidebar;
    previousSidebarVisibilityRef.current = showSidebar;
    const stored = remember ? readStoredMapView(blueprintKey, zoomLevels) : null;
    if (!sidebarVisibilityChanged && stored?.viewportWidth === viewportSize.width) return;
    if (!viewportSize.width || !viewportSize.height) return;
    if (!viewportRef.current) return;
    if (!fitModeRef.current) {
      setMapSizeReady(true);
      return;
    }
    fitToViewport();
    setMapSizeReady(true);
  }, [
    blueprintKey,
    captureOnly,
    fitPolicy,
    remember,
    showSidebar,
    viewportSize.height,
    viewportSize.width,
    width,
  ]);
  useEffect(() => {
    if (!remember || !blueprintKey || !mapSizeReady) return;
    writeStorageValue(
      SAVED_MAP_VIEW_KEY,
      JSON.stringify({
        blueprint: blueprintKey,
        viewportWidth: viewportSize.width,
        fit: fitModeRef.current,
        zoom,
        pan,
      }),
    );
  }, [blueprintKey, mapSizeReady, pan, remember, viewportSize.width, zoom]);
  useEffect(() => {
    livePanRef.current = pan;
    return () => {
      if (panCommitTimerRef.current !== null) {
        window.clearTimeout(panCommitTimerRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [pan]);
  const setMapZoom = (nextZoom: number, pointer?: { x: number; y: number }) => {
    fitModeRef.current = false;
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, roundZoom(nextZoom)));
    const nextViewWidth = width / clampedZoom;
    const nextViewHeight = height / clampedZoom;
    const nextCenteredViewX = (width - nextViewWidth) / 2;
    const nextCenteredViewY = (height - nextViewHeight) / 2;
    const viewportWidth = viewportSize.width || width;
    const viewportHeight = viewportSize.height || height;
    const nextMaxPanX = calculateMaxPan(width, viewportWidth, clampedZoom);
    const nextMaxPanY = calculateMaxPan(height, viewportHeight, clampedZoom);
    const centerX = pointer
      ? width / 2 + pan.x + (pointer.x - viewportWidth / 2) / zoom
      : width / 2 + pan.x;
    const centerY = pointer
      ? height / 2 + pan.y + (pointer.y - viewportHeight / 2) / zoom
      : height / 2 + pan.y;
    const nextPanX = pointer
      ? centerX - width / 2 - (pointer.x - viewportWidth / 2) / clampedZoom
      : centerX - nextViewWidth / 2 - nextCenteredViewX;
    const nextPanY = pointer
      ? centerY - height / 2 - (pointer.y - viewportHeight / 2) / clampedZoom
      : centerY - nextViewHeight / 2 - nextCenteredViewY;
    setZoom(clampedZoom);
    setPan({
      x: Math.max(-nextMaxPanX, Math.min(nextMaxPanX, nextPanX)),
      y: Math.max(-nextMaxPanY, Math.min(nextMaxPanY, nextPanY)),
    });
  };
  const exportPng = async () => {
    const rendered = renderBlueprintToSvg(blueprint, {
      model: mapModel,
      catalog: blueprintCatalog(),
      unknownFootprint: UNKNOWN_STRUCTURE_FOOTPRINT,
      padding,
      cell,
      assetBaseUrl: import.meta.env.BASE_URL,
      includeBackground: showPngBackground,
      showGrid,
      showFoundationOutlines: true,
      showSignalLinks: true,
      showEdgeFade: true,
    });
    const scale = exportScale / renderPixelScale(cell);
    const prepared = await prepareSvgForPng(rendered.svg, {
      width,
      height,
      scale,
      title: blueprint.name,
      includeBackground: showPngBackground,
      resolveImage: createImageResolver(document.baseURI),
    });
    const image = await createBrowserPngPlatform().loadSvg(prepared);
    const bitmap = await createImageBitmap(image);
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));
    const worker = new Worker(new URL("../blueprint-worker.ts", import.meta.url), {
      type: "module",
    });
    const exportId = `export-${Date.now()}`;
    const png = await new Promise<ArrayBuffer>((resolve, reject) => {
      worker.onmessage = (
        event: MessageEvent<{
          id?: number | string;
          type: string;
          png?: ArrayBuffer;
          message?: string;
        }>,
      ) => {
        if (event.data.id && event.data.id !== exportId) return;
        if (event.data.type === "result" && event.data.png) resolve(event.data.png);
        else if (event.data.type === "error") reject(new Error(event.data.message));
      };
      worker.onerror = () => reject(new Error("Blueprint PNG worker stopped unexpectedly"));
      worker.postMessage(
        {
          id: exportId,
          type: "encode",
          image: bitmap,
          width: outputWidth,
          height: outputHeight,
        },
        [bitmap],
      );
    }).finally(() => worker.terminate());
    const filename = `${blueprint.name.trim().replace(/[^a-z0-9._-]+/gi, "-") || "blueprint"}.png`;
    if (onExportPng) {
      onExportPng(png, filename);
      return;
    }
    const blob = new Blob([png], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  return (
    <div
      className={
        fullHeight
          ? "relative flex flex-1 h-full min-h-0 w-full overflow-hidden"
          : showSidebar && !externalSidebar
            ? cx("grid items-stretch lg:grid-cols-[minmax(0,1fr)_18rem]", !embedMode && "gap-4")
            : "grid items-stretch"
      }
    >
      <div
        className={
          fullHeight ? "relative flex flex-1 h-full min-h-0 w-full overflow-hidden" : "min-w-0"
        }
      >
        <div
          className={fullHeight ? "pointer-events-none absolute inset-0 z-20" : "sticky z-20 h-0"}
          style={fullHeight ? undefined : { top: stickyTop ?? `${siteHeaderHeight}px` }}
        >
          <div className={fullHeight ? "pointer-events-auto" : undefined}>
            <BlueprintMapViewportControls
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              measuredFitZoom={measuredFitZoom}
              fitMode={fitModeRef.current}
              pan={pan}
              onExport={exportPng}
              onZoomOut={() => setMapZoom(stepZoomOut(zoom, { min: minZoom }))}
              onFit={fitToViewport}
              onZoomIn={() => setMapZoom(stepZoomIn(zoom, { max: maxZoom }))}
            />
          </div>
        </div>
        <div
          ref={viewportRef}
          tabIndex={0}
          role="region"
          aria-label={`${blueprint.name} map viewport${
            selected
              ? `: selected ${structureLabel(selected.type)} at ${selected.x}, ${selected.y} (${(selectedIndex ?? 0) + 1} of ${blueprint.data.length})`
              : ""
          }`}
          className={cx(
            "blueprint-map__viewport relative overflow-hidden bg-[#33a8ff] [overscroll-behavior:contain] focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none",
            fullHeight
              ? "blueprint-map__viewport--full-height h-full w-full flex-1 min-h-0 min-w-0"
              : "min-h-[32rem] rounded border border-slate-800",
          )}
          translate="no"
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "+" || event.key === "=") {
              event.preventDefault();
              setMapZoom(stepZoomIn(zoom, { max: maxZoom }));
            } else if (event.key === "-" || event.key === "_") {
              event.preventDefault();
              setMapZoom(stepZoomOut(zoom, { min: minZoom }));
            } else if (event.key === "0" || event.key.toLowerCase() === "f") {
              event.preventDefault();
              fitToViewport();
            } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              if (blueprint.data.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) =>
                  prev === null ? 0 : (prev + 1) % blueprint.data.length,
                );
              }
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              if (blueprint.data.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) =>
                  prev === null
                    ? blueprint.data.length - 1
                    : (prev - 1 + blueprint.data.length) % blueprint.data.length,
                );
              }
            } else if (event.key === "Escape") {
              if (selectedIndex !== null) {
                event.preventDefault();
                setSelectedIndex(null);
              }
            }
          }}
          onWheelCapture={(event) => {
            if (!captureOnly) event.preventDefault();
          }}
          onWheel={(event) => {
            if (captureOnly) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.deltaY === 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const point = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            };
            const nextZoom = wheelZoom(zoom, event.deltaY, { min: minZoom, max: maxZoom });
            setMapZoom(nextZoom, point);
          }}
          style={
            captureOnly
              ? { width: `${Math.ceil(width)}px`, height: `${Math.ceil(height)}px` }
              : fullHeight
                ? { height: "100%", width: "100%" }
                : {
                    height: `${Math.max(512, Math.ceil(aspectRatioViewportHeight))}px`,
                  }
          }
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${blueprint.name} structure map`}
            preserveAspectRatio="xMidYMid meet"
            className="blueprint-map__canvas absolute max-w-none"
            style={{
              width: `${width * zoom}px`,
              height: `${height * zoom}px`,
              left: "50%",
              top: "50%",
              transform: `translate3d(-50%, -50%, 0) translate3d(${-pan.x * zoom}px, ${-pan.y * zoom}px, 0)`,
              willChange: "transform",
              zIndex: viewportGridEnabled ? 1 : undefined,
              overflow: viewportGridEnabled ? "visible" : undefined,
              cursor: dragRef.current ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) return;
              clearHoverBlock();
              if (panCommitTimerRef.current !== null) {
                window.clearTimeout(panCommitTimerRef.current);
                panCommitTimerRef.current = null;
                setPan(livePanRef.current);
              } else {
                livePanRef.current = pan;
              }
              dragRef.current = {
                pointerId: event.pointerId,
                lastX: event.clientX,
                lastY: event.clientY,
                moved: false,
              };
              event.currentTarget.style.cursor = "grabbing";
            }}
            onClick={handleMapClick}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (drag && drag.pointerId === event.pointerId) {
                const dx = event.clientX - drag.lastX;
                const dy = event.clientY - drag.lastY;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                  drag.moved = true;
                  suppressClickRef.current = true;
                  fitModeRef.current = false;
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                }
                const dragScale = 1 / zoom;
                const nextPan = {
                  x: Math.max(-maxPanX, Math.min(maxPanX, livePanRef.current.x - dx * dragScale)),
                  y: Math.max(-maxPanY, Math.min(maxPanY, livePanRef.current.y - dy * dragScale)),
                };
                livePanRef.current = nextPan;
                applyLivePan(nextPan);
                schedulePanCommit();
                drag.lastX = event.clientX;
                drag.lastY = event.clientY;
              } else {
                updateHoverBlock(event);
              }
            }}
            onPointerUp={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
              }
              const svg = svgRef.current;
              if (svg) {
                svg.style.transform = `translate3d(-50%, -50%, 0) translate3d(${-livePanRef.current.x * zoom}px, ${-livePanRef.current.y * zoom}px, 0)`;
              }
              suppressClickRef.current = drag.moved;
              dragRef.current = null;
              event.currentTarget.style.cursor = "grab";
              if (drag.moved) schedulePanCommit();
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
              }
              dragRef.current = null;
              event.currentTarget.style.cursor = "grab";
              schedulePanCommit();
            }}
            onPointerLeave={() => {
              clearHoverBlock();
            }}
          >
            <BlueprintMapGridLayer
              width={width}
              height={height}
              gridOriginX={gridOriginX}
              gridOriginY={gridOriginY}
              cell={cell}
              showGrid={showGrid}
              showBackground={!viewportGridEnabled}
              extendToViewport={viewportGridEnabled}
              viewportWidth={viewportSize.width || width}
              viewportHeight={viewportSize.height || defaultViewportHeight}
              zoom={zoom}
            />
            {showDebugCells ? (
              <g opacity="0.8" pointerEvents="none" style={mapLayerStyle("debugCells")}>
                {blueprint.data.flatMap((structure, structureIndex) => {
                  const prepared = preparedBlueprint.preparedStructures[structureIndex];
                  const footprint = prepared.footprint;
                  const shape =
                    prepared.shape ??
                    Array.from({ length: footprint.height }, () =>
                      Array.from({ length: footprint.width }, () => 1),
                    );
                  const topY = prepared.topY;
                  const left = (structure.x - minX + padding) * cell;
                  const top = (topY - minY + padding) * cell;
                  return shape.flatMap((row, rowIndex) =>
                    row.map((value, columnIndex) =>
                      value === 0 ? null : (
                        <rect
                          key={`debug-cell-${structureIndex}-${rowIndex}-${columnIndex}`}
                          x={left + columnIndex * cell}
                          y={top + rowIndex * cell}
                          width={cell}
                          height={cell}
                          rx="2"
                          fill={tileColor(structure.type)}
                        />
                      ),
                    ),
                  );
                })}
              </g>
            ) : null}
            <g dangerouslySetInnerHTML={{ __html: baseRender.markup }} pointerEvents="auto" />
            {filterOverlayMarkup ? (
              <g dangerouslySetInnerHTML={{ __html: filterOverlayMarkup }} pointerEvents="none" />
            ) : null}
            <BlueprintMapRawStructuresLayer
              preparedBlueprint={preparedBlueprint}
              visible={showRawStructures}
              minX={minX}
              minY={minY}
              padding={padding}
              cell={cell}
            />
            {!viewportGridEnabled ? (
              <BlueprintMapEdgeFadeLayer
                width={width}
                height={height}
                padding={padding}
                cell={cell}
              />
            ) : null}
            {selected ? (
              <rect
                x={(selected.x - minX + padding) * cell}
                y={(selected.y - minY + padding) * cell}
                width={BLOCK_COORDINATE_SIZE * cell}
                height={BLOCK_COORDINATE_SIZE * cell}
                fill="none"
                stroke="#4ade80"
                strokeWidth={renderPixelScale(cell)}
                pointerEvents="none"
                style={mapLayerStyle("selectedHighlight")}
              />
            ) : null}
            <rect
              ref={hoverMarkerRef}
              x="0"
              y="0"
              width={BLOCK_COORDINATE_SIZE * cell}
              height={BLOCK_COORDINATE_SIZE * cell}
              fill="#ffe700"
              fillOpacity="0.08"
              stroke="#ffe700"
              strokeWidth={renderPixelScale(cell) / 2}
              visibility="hidden"
              pointerEvents="none"
              style={mapLayerStyle("hoverHighlight")}
            />
          </svg>
        </div>
      </div>
      {showSidebar && !externalSidebar ? (
        <BlueprintMapSidebar
          selected={selected}
          selectedIndex={selectedIndex}
          preparedStructure={
            selectedIndex !== null ? preparedBlueprint.preparedStructures[selectedIndex] : null
          }
          totalStructures={blueprint.data.length}
          blueprint={blueprint}
          activeFilterCluster={activeFilterCluster}
          matchingFiltersCount={activeFilterCluster ? matchingFiltersCount : undefined}
          highlightMatchingFilters={highlightMatchingFilters}
          onHighlightMatchingFiltersChange={handleHighlightMatchingFiltersChange}
          onClearSelection={() => setSelectedIndex(null)}
          debugOptions={showDebugOptions ? debugOptions : null}
          embedMode={embedMode}
        />
      ) : null}
    </div>
  );
}
