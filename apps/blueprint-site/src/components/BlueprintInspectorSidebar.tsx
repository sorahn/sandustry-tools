import { useState, type ReactNode } from "react";
import cx from "clsx";
import {
  structureLabel,
  type PreparedStructure,
  type FilterOverlayCluster,
} from "@daryl.roberts/sandustry-blueprint-core";
import { Button, SegmentedControl } from "@sandustry/ui";
import { type Blueprint } from "../utils/blueprint";
import { BlueprintMapSidebar } from "./BlueprintMapSidebar";
import { BlueprintStructuresPanel } from "./BlueprintStructuresPanel";
import { type BlueprintSummary } from "./BlueprintSubmissionPanel";

export type BlueprintInspectorSidebarProps = {
  blueprint: Blueprint;
  summary: BlueprintSummary | null;
  encoded: string;
  selected: Blueprint["data"][number] | null;
  selectedIndex: number | null;
  preparedStructure?: PreparedStructure | null;
  activeFilterCluster?: FilterOverlayCluster | null;
  matchingFiltersCount?: number;
  highlightMatchingFilters?: boolean;
  onHighlightMatchingFiltersChange?: (value: boolean) => void;
  onClearSelection?: () => void;
  debugOptions: ReactNode;
  onOpenImport?: () => void;
  onExportPng?: () => void;
  onCopyString?: () => void;
  copied?: boolean;
  className?: string;
};

export function BlueprintInspectorSidebar({
  blueprint,
  summary,
  encoded: _encoded,
  selected,
  selectedIndex,
  preparedStructure,
  activeFilterCluster,
  matchingFiltersCount,
  highlightMatchingFilters,
  onHighlightMatchingFiltersChange,
  onClearSelection,
  debugOptions,
  onOpenImport,
  onExportPng,
  onCopyString,
  copied = false,
  className,
}: BlueprintInspectorSidebarProps) {
  const [tab, setTab] = useState<"structure" | "structures" | "info">("structure");

  return (
    <div className={cx("flex flex-col text-slate-300", className)}>
      {/* Top Segmented Controls */}
      <div className="border-b border-slate-800/80 p-2.5 bg-slate-950/30">
        <SegmentedControl
          size="small"
          value={tab}
          onChange={(val) => setTab(val)}
          options={[
            { value: "structure", label: selected ? "Selected" : "Structure" },
            { value: "structures", label: `All (${blueprint.data.length})` },
            { value: "info", label: "Overview" },
          ]}
          className="w-full"
        />
      </div>

      {/* Tab 1: Selected Structure Inspector */}
      {tab === "structure" ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <BlueprintMapSidebar
            className="w-full"
            selected={selected}
            selectedIndex={selectedIndex}
            preparedStructure={preparedStructure}
            totalStructures={blueprint.data.length}
            blueprint={blueprint}
            activeFilterCluster={activeFilterCluster}
            matchingFiltersCount={matchingFiltersCount}
            highlightMatchingFilters={highlightMatchingFilters}
            onHighlightMatchingFiltersChange={onHighlightMatchingFiltersChange}
            onClearSelection={onClearSelection}
            debugOptions={debugOptions}
          />
        </div>
      ) : null}

      {/* Tab 2: Full Structures Table */}
      {tab === "structures" ? (
        <div className="flex-1 min-h-0 p-3 overflow-y-auto">
          <BlueprintStructuresPanel blueprint={blueprint} structureLabel={structureLabel} />
        </div>
      ) : null}

      {/* Tab 3: Blueprint Overview & Notes */}
      {tab === "info" ? (
        <div className="flex-1 min-h-0 space-y-4 p-4 text-xs leading-relaxed text-slate-400 overflow-y-auto">
          {summary ? (
            <div className="rounded border border-slate-800 bg-black/40 p-3 space-y-2 font-mono text-xs">
              <div className="font-semibold text-slate-200">{blueprint.name}</div>
              <div className="text-[11px] text-slate-400">
                Format: <span className="text-yellow-400">{summary.format}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Dimensions:{" "}
                <span className="text-slate-200">
                  {summary.maxX - summary.minX + 1} × {summary.maxY - summary.minY + 1}
                </span>{" "}
                cells
              </div>
              <div className="text-[11px] text-slate-400">
                Total structures: <span className="text-slate-200">{blueprint.data.length}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Unique types: <span className="text-slate-200">{summary.types}</span>
              </div>
              {summary.filters > 0 ? (
                <div className="text-[11px] text-slate-400">
                  Filters configured: <span className="text-slate-200">{summary.filters}</span>
                </div>
              ) : null}
              {summary.links > 0 ? (
                <div className="text-[11px] text-slate-400">
                  Signal links: <span className="text-slate-200">{summary.links}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {onCopyString ? (
              <Button type="button" variant="solid" onClick={onCopyString}>
                {copied ? "Copied to clipboard!" : "Copy blueprint string"}
              </Button>
            ) : null}
            {onExportPng ? (
              <Button type="button" variant="quiet" onClick={onExportPng}>
                Export PNG
              </Button>
            ) : null}
            {onOpenImport ? (
              <Button type="button" variant="quiet" onClick={onOpenImport}>
                Import another blueprint
              </Button>
            ) : null}
          </div>

          {/* Map notes */}
          <div className="border-t border-slate-800/80 pt-3 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Support notes
            </div>
            <div>
              <span className="font-semibold text-emerald-300">Works here: </span>
              v2 binary & text blueprints, native structures, filters, rotation, signal links.
            </div>
            <div>
              <span className="font-semibold text-amber-300">Approximated: </span>
              Pipes visuals, custom wall light colors, uncalibrated modded sprites.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
