import { type ReactNode, useMemo } from "react";
import cx from "clsx";
import { type Blueprint } from "../utils/blueprint";
import { catalogEntry, catalogRender, catalogRenderSize } from "../utils/catalog";
import {
  structureLabel,
  resolveElement,
  normalizeElementList,
  MATTER_TYPE,
  isFilterStructure,
  customShapeFromStructure,
  isFoundationStructure,
  type FilterOverlayCluster,
  type PreparedStructure,
} from "@daryl.roberts/sandustry-blueprint-core";
import { structureFootprint, structureTopY } from "../utils/blueprint-map";
import { BlueprintMapSidebarSection } from "./BlueprintMapSidebarSection";
import { StructureThumbnail } from "./StructureThumbnail";
import { Badge, Checkbox, TextAction } from "@sandustry/ui";

type BlueprintStructure = Blueprint["data"][number];

export type BlueprintMapSidebarProps = {
  selected: BlueprintStructure | null;
  selectedIndex?: number | null;
  preparedStructure?: PreparedStructure | null;
  totalStructures?: number;
  blueprint?: Blueprint;
  activeFilterCluster?: FilterOverlayCluster | null;
  matchingFiltersCount?: number;
  highlightMatchingFilters?: boolean;
  onHighlightMatchingFiltersChange?: (value: boolean) => void;
  onClearSelection?: () => void;
  debugOptions: ReactNode;
  embedMode?: boolean;
};

function matterLabel(matterType?: number): string {
  switch (matterType) {
    case MATTER_TYPE.SOLID:
      return "Solid";
    case MATTER_TYPE.LIQUID:
      return "Liquid";
    case MATTER_TYPE.GAS:
      return "Gas";
    default:
      return "Unknown";
  }
}

function matterBadgeClass(matterType?: number): string {
  switch (matterType) {
    case MATTER_TYPE.SOLID:
      return "bg-amber-950/60 text-amber-300 border-amber-800/40";
    case MATTER_TYPE.LIQUID:
      return "bg-blue-950/60 text-blue-300 border-blue-800/40";
    case MATTER_TYPE.GAS:
      return "bg-purple-950/60 text-purple-300 border-purple-800/40";
    default:
      return "bg-slate-900 text-slate-400 border-slate-800";
  }
}

export function BlueprintMapSidebar({
  selected,
  selectedIndex,
  preparedStructure,
  totalStructures,
  blueprint,
  activeFilterCluster,
  matchingFiltersCount,
  highlightMatchingFilters,
  onHighlightMatchingFiltersChange,
  onClearSelection,
  debugOptions,
  embedMode = false,
}: BlueprintMapSidebarProps) {
  const entry = selected ? catalogEntry(selected.type) : undefined;
  const footprint = selected ? structureFootprint(selected) : { width: 4, height: 4 };
  const topY = selected ? structureTopY(selected) : 0;
  const render = entry ? catalogRender(entry) : undefined;
  const renderSize = render ? catalogRenderSize(render) : undefined;

  const customShape = useMemo(() => {
    return (
      preparedStructure?.customShape ?? (selected ? customShapeFromStructure(selected) : undefined)
    );
  }, [selected, preparedStructure]);

  const isPrefab = Boolean(
    (typeof selected?.type === "string" && selected.type.startsWith("prefabTerrain")) ||
    customShape,
  );

  const name = useMemo(() => {
    if (!selected) return "";
    if (entry?.name) return entry.name;
    const typeStr = String(selected.type);
    const prefabMatch = typeStr.match(/^prefabTerrain(?:_(\d+))?$/);
    if (prefabMatch) {
      return prefabMatch[1] ? `Terrain Prefab #${prefabMatch[1]}` : "Terrain Prefab";
    }
    if (customShape) return "Custom Prefab";
    return structureLabel(selected.type);
  }, [selected, entry?.name, customShape]);

  const category = entry?.category ?? (isPrefab ? "blocks" : undefined);

  const solidCellCount = useMemo(() => {
    if (!customShape) return 0;
    return customShape.reduce(
      (acc, row) => acc + row.reduce((rAcc, cell) => rAcc + (cell > 0 ? 1 : 0), 0),
      0,
    );
  }, [customShape]);

  const outlineShape =
    preparedStructure && isFoundationStructure(preparedStructure)
      ? (preparedStructure.shape ??
        Array.from({ length: preparedStructure.footprint.height }, () =>
          Array.from({ length: preparedStructure.footprint.width }, () => 1),
        ))
      : undefined;

  const sprite = preparedStructure?.sprite;
  const asset = sprite?.asset ?? entry?.renderAsset;
  const frameIndex = sprite?.frameIndex ?? asset?.frameIndex ?? 0;
  const rotation = sprite?.rotation ?? asset?.rotation ?? 0;
  const lightColor = preparedStructure?.lightColor;

  // Connected signals
  const connectedSignalLinks = useMemo(() => {
    if (!blueprint?.signalLinks || !selected) return [];
    const minX = selected.x;
    const maxX = selected.x + footprint.width - 1;
    const minY = topY;
    const maxY = topY + footprint.height - 1;
    return blueprint.signalLinks.filter(
      (link) =>
        (link.from.x >= minX &&
          link.from.x <= maxX &&
          link.from.y >= minY &&
          link.from.y <= maxY) ||
        (link.to.x >= minX && link.to.x <= maxX && link.to.y >= minY && link.to.y <= maxY),
    );
  }, [blueprint?.signalLinks, selected, footprint, topY]);

  // Filter configuration
  const isFilter = selected ? isFilterStructure(selected.type) || Boolean(selected.filter) : false;
  const rawFilter = selected?.filter as Record<string, unknown> | undefined;
  const filterMode = rawFilter?.mode === "block" ? "block" : "allow";
  const filterElementIds = useMemo(
    () => normalizeElementList(rawFilter?.elementType),
    [rawFilter?.elementType],
  );
  const filterElements = useMemo(
    () => filterElementIds.map((id) => ({ id, ...resolveElement(id) })),
    [filterElementIds],
  );
  const speedExemptIds = useMemo(
    () =>
      normalizeElementList(rawFilter?.speedExemptElementType ?? rawFilter?.speedExemptElementTypes),
    [rawFilter],
  );
  const speedExemptElements = useMemo(
    () => speedExemptIds.map((id) => ({ id, ...resolveElement(id) })),
    [speedExemptIds],
  );
  const density =
    rawFilter?.density !== undefined && rawFilter.density !== null
      ? Number(rawFilter.density)
      : undefined;
  const affectsLiquid = rawFilter?.affectsLiquid as boolean | undefined;
  const affectsGas = rawFilter?.affectsGas as boolean | undefined;

  const dataRecord = selected?.data as Record<string, unknown> | undefined;
  const passThrough = Boolean(dataRecord?.filterPassThrough);

  // Mod / Custom source element (e.g. Test Blocks Infinite Source)
  const sourceElementId = dataRecord?.elementId ?? dataRecord?.elementType;
  const sourceElement =
    typeof sourceElementId === "number" || typeof sourceElementId === "string"
      ? { id: sourceElementId, ...resolveElement(sourceElementId) }
      : undefined;

  return (
    <aside
      className={cx(
        "flex flex-col border-l border-slate-800 pl-4 text-xs text-slate-400",
        embedMode && "max-h-screen overflow-x-hidden overflow-y-auto pt-4 pr-4",
      )}
    >
      {debugOptions}
      <BlueprintMapSidebarSection
        title="Selected record"
        headerAction={
          selected && onClearSelection ? (
            <TextAction
              type="button"
              onClick={onClearSelection}
              className="font-sans text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </TextAction>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3.5">
            {/* Header: Sprite Thumbnail + Title + Type/Category */}
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-black/40 p-2.5">
              <StructureThumbnail
                asset={asset}
                frameIndex={frameIndex}
                rotation={rotation}
                lightColor={lightColor}
                footprint={footprint}
                name={name}
                structureType={selected?.type}
                customShape={customShape}
                outlineShape={outlineShape}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-slate-100 text-sm leading-snug truncate">
                    {name}
                  </h4>
                  {category ? (
                    <Badge tone="default" className="shrink-0 text-[10px] uppercase tracking-wide">
                      {category}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  {selectedIndex !== null && selectedIndex !== undefined ? (
                    <span className="text-yellow-400 font-medium">
                      #{selectedIndex + 1}
                      {totalStructures ? ` / ${totalStructures}` : ""}
                    </span>
                  ) : null}
                  {selectedIndex !== null && selectedIndex !== undefined ? (
                    <span className="text-slate-600">·</span>
                  ) : null}
                  <span className="text-slate-400 truncate">{String(selected.type)}</span>
                </div>
              </div>
            </div>

            {/* Unknown structure alert if no catalog entry and not a prefab */}
            {!entry && !isPrefab ? (
              <p className="rounded border border-amber-700/60 bg-amber-950/30 p-2 text-amber-200 text-xs">
                Unknown structure — no catalog entry or sprite is available. Showing a placeholder
                using the raw blueprint record.
              </p>
            ) : null}

            {/* Filter Configuration Card */}
            {isFilter ? (
              <div className="rounded-lg border border-slate-800 bg-black/30 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Filter Configuration
                  </span>
                  {passThrough ? (
                    <span className="rounded border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                      Pass-Through
                    </span>
                  ) : null}
                </div>

                {/* Mode Pill */}
                {filterElements.length === 0 ? (
                  <div className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                    <span className="font-semibold">Pass All (None)</span>
                    <span className="ml-auto text-[10px] text-slate-500">Unconfigured</span>
                  </div>
                ) : filterMode === "block" ? (
                  <div className="flex items-center gap-1.5 rounded border border-red-900/60 bg-red-950/40 px-2.5 py-1.5 text-xs text-red-300">
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-semibold">Block Matching</span>
                    <span className="ml-auto text-[10px] text-red-400/80">
                      Excludes items below
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded border border-blue-900/60 bg-blue-950/40 px-2.5 py-1.5 text-xs text-blue-300">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-semibold">Allow Only</span>
                    <span className="ml-auto text-[10px] text-blue-400/80">
                      Permits items below
                    </span>
                  </div>
                )}

                {/* Configured Elements List */}
                {filterElements.length > 0 ? (
                  <div className="space-y-1">
                    {filterElements.map((el) => (
                      <div
                        key={el.id}
                        className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/70 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm border border-white/20 shadow-sm"
                            style={{ backgroundColor: el.color }}
                          />
                          <span className="truncate font-medium text-slate-200 text-xs">
                            {el.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">#{el.id}</span>
                        </div>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono ${matterBadgeClass(
                            el.matterType,
                          )}`}
                        >
                          {matterLabel(el.matterType)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Advanced parameters */}
                {density !== undefined ||
                affectsLiquid !== undefined ||
                affectsGas !== undefined ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {density !== undefined ? (
                      <div className="rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1">
                        <span className="text-slate-500 block text-[10px]">Density</span>
                        <span className="font-mono text-slate-200">≥ {density}</span>
                      </div>
                    ) : null}
                    {affectsLiquid !== undefined ? (
                      <div className="rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1">
                        <span className="text-slate-500 block text-[10px]">Liquids</span>
                        <span className="font-mono text-slate-200">
                          {affectsLiquid ? "Filtered" : "Ignored"}
                        </span>
                      </div>
                    ) : null}
                    {affectsGas !== undefined ? (
                      <div className="rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1">
                        <span className="text-slate-500 block text-[10px]">Gases</span>
                        <span className="font-mono text-slate-200">
                          {affectsGas ? "Filtered" : "Ignored"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Speed Exempt Elements */}
                {speedExemptElements.length > 0 ? (
                  <div className="pt-1 text-[11px]">
                    <span className="text-slate-500 block text-[10px] mb-1">
                      Speed Exempt Elements
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {speedExemptElements.map((el) => (
                        <span
                          key={el.id}
                          className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: el.color }}
                          />
                          <span>{el.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Cluster context */}
                {activeFilterCluster ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/60 rounded px-2 py-1.5 mt-1">
                    <svg
                      className="h-3 w-3 text-blue-400 shrink-0"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="12"
                        height="12"
                        rx="1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span>
                      Cluster:{" "}
                      <strong className="text-slate-200">
                        {activeFilterCluster.members.length}
                      </strong>{" "}
                      {activeFilterCluster.isVertical ? "vertical" : "horizontal"} filter{" "}
                      {activeFilterCluster.members.length === 1 ? "unit" : "units"}
                    </span>
                  </div>
                ) : null}

                {/* Highlight matching filters */}
                {activeFilterCluster && matchingFiltersCount !== undefined ? (
                  <div className="pt-1.5 border-t border-slate-800/60">
                    <Checkbox
                      size="small"
                      label={
                        <span className="text-[11px] text-slate-300">
                          Highlight matching filters{" "}
                          <strong className="text-slate-200">({matchingFiltersCount})</strong>
                        </span>
                      }
                      checked={highlightMatchingFilters ?? false}
                      onChange={(e) => onHighlightMatchingFiltersChange?.(e.target.checked)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Mod / Custom Source Data (Infinite Source) */}
            {sourceElement ? (
              <div className="rounded-lg border border-slate-800 bg-black/30 p-2.5 space-y-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                  Infinite Source Output
                </span>
                <div className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/70 px-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm border border-white/20 shadow-sm"
                      style={{ backgroundColor: sourceElement.color }}
                    />
                    <span className="truncate font-medium text-slate-200 text-xs">
                      {sourceElement.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      #{sourceElement.id}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono ${matterBadgeClass(
                      sourceElement.matterType,
                    )}`}
                  >
                    {matterLabel(sourceElement.matterType)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Emits material continuously into empty cells below
                </span>
              </div>
            ) : null}

            {/* Prefab Terrain Details */}
            {isPrefab && customShape ? (
              <div className="rounded-lg border border-slate-800 bg-black/30 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Prefab Terrain Definition
                  </span>
                  <span className="rounded border border-sky-800/60 bg-sky-950/40 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                    Procedural
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Procedural foundation block generated from {solidCellCount} solid{" "}
                  {solidCellCount === 1 ? "cell" : "cells"}.
                </p>
                {/* TODO: Render composition after adding terrain-ID resolution for prefab cellIds. */}
              </div>
            ) : null}

            {/* Signal connections */}
            {connectedSignalLinks.length > 0 ? (
              <div className="rounded-lg border border-slate-800 bg-black/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Signal Connections
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {connectedSignalLinks.length} wire
                    {connectedSignalLinks.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {connectedSignalLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/70 px-2 py-1 text-[11px]"
                    >
                      <span className="font-mono text-slate-300">
                        ({link.from.x}, {link.from.y}) → ({link.to.x}, {link.to.y})
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.2 text-[10px] font-mono ${
                          link.on
                            ? "border-emerald-800/50 bg-emerald-950/50 text-emerald-400 font-semibold"
                            : "border-slate-800 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {link.on ? "ON" : "OFF"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Placement & Geometry Grid */}
            <div className="rounded-lg border border-slate-800 bg-black/30 p-2.5 space-y-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                Placement & Geometry
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-slate-800/60 bg-slate-950/50 p-2">
                  <span className="text-slate-500 block text-[10px]">Position</span>
                  <span className="font-mono text-slate-200 font-medium">
                    {selected.x}, {selected.y}
                  </span>
                </div>
                <div className="rounded border border-slate-800/60 bg-slate-950/50 p-2">
                  <span className="text-slate-500 block text-[10px]">Footprint</span>
                  <span className="font-mono text-slate-200 font-medium">
                    {footprint.width}×{footprint.height} cells
                  </span>
                </div>
                <div className="rounded border border-slate-800/60 bg-slate-950/50 p-2">
                  <span className="text-slate-500 block text-[10px]">Cell Bounds</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    X: {selected.x}..{selected.x + footprint.width - 1}
                    <br />
                    Y: {topY}..{topY + footprint.height - 1}
                  </span>
                </div>
                {renderSize ? (
                  <div className="rounded border border-slate-800/60 bg-slate-950/50 p-2">
                    <span className="text-slate-500 block text-[10px]">Sprite Asset</span>
                    <span
                      className="font-mono text-slate-400 text-[11px] truncate block"
                      title={render?.imageName}
                    >
                      {render?.imageName ?? "—"}
                    </span>
                    <span className="text-slate-600 text-[10px]">
                      {renderSize.width}×{renderSize.height}px
                    </span>
                  </div>
                ) : isPrefab ? (
                  <div className="rounded border border-slate-800/60 bg-slate-950/50 p-2">
                    <span className="text-slate-500 block text-[10px]">Foundation Texture</span>
                    <span
                      className="font-mono text-slate-400 text-[11px] truncate block"
                      title="img__block.png"
                    >
                      img__block.png
                    </span>
                    <span className="text-slate-600 text-[10px]">
                      {solidCellCount} / {footprint.width * footprint.height} solid cells
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Collapsible Raw Blueprint Record & Catalog Definition */}
            <details className="rounded-lg border border-slate-800 bg-black/40 p-2 group text-xs">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-200 select-none flex items-center justify-between font-mono text-[11px]">
                <span>Raw Record (JSON)</span>
                <span className="text-[10px] text-slate-600 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-400 bg-black/60 p-2 rounded border border-slate-900 font-mono">
                {JSON.stringify(selected, null, 2)}
              </pre>
              {entry ? (
                <details className="mt-2 border-t border-slate-900 pt-2">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-300 text-[11px] select-none font-mono">
                    Catalog Definition
                  </summary>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-slate-500 bg-black/60 p-2 rounded border border-slate-900 font-mono">
                    {JSON.stringify(entry.definition ?? entry, null, 2)}
                  </pre>
                </details>
              ) : null}
            </details>
          </div>
        ) : (
          <p className="leading-6">
            Choose a tile to inspect its structure details and filter configuration.
          </p>
        )}
      </BlueprintMapSidebarSection>
    </aside>
  );
}
