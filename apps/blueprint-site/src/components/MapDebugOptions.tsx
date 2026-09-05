import { PersistentCheckbox } from "./PersistentCheckbox";
import { BlueprintMapSidebarSection } from "./BlueprintMapSidebarSection";
import { type ReactNode } from "react";
import {
  SHOW_CUSTOM_SHAPES_KEY,
  SHOW_DEBUG_CELLS_KEY,
  SHOW_FOUNDATION_OUTLINES_KEY,
  SHOW_NAMES_KEY,
  SHOW_RAW_STRUCTURES_KEY,
  SHOW_SIGNAL_LINKS_KEY,
  SHOW_SPRITES_KEY,
  COLLAPSE_DEBUG_OPTIONS_KEY,
  COLLAPSE_TEST_BLUEPRINTS_KEY,
  COLLAPSE_POLICY_TESTER_KEY,
} from "../utils/storage-keys";
import {
  DEFAULT_FIT_POLICY,
  FIT_POLICY_PRESETS,
  type FitPolicyPreset,
} from "../utils/blueprint-fit";
import { Button, Divider, IconButton, Select } from "@sandustry/ui";
import { BLUEPRINT_VISUAL_FIXTURES } from "../visual-fixtures/catalog";

type MapDebugOptionsProps = {
  showDebugCells: boolean;
  onShowDebugCellsChange: (value: boolean) => void;
  showNames: boolean;
  onShowNamesChange: (value: boolean) => void;
  showSprites: boolean;
  onShowSpritesChange: (value: boolean) => void;
  showCustomShapes: boolean;
  onShowCustomShapesChange: (value: boolean) => void;
  showFoundationOutlines: boolean;
  onShowFoundationOutlinesChange: (value: boolean) => void;
  showSignalLinks: boolean;
  onShowSignalLinksChange: (value: boolean) => void;
  showRawStructures: boolean;
  onShowRawStructuresChange: (value: boolean) => void;
  resetVersion?: number;
  onReset: () => void;
  onLoadBlueprint: (blueprint: (typeof BLUEPRINT_VISUAL_FIXTURES)[number]["blueprint"]) => void;
  policySelection?: "legacy" | FitPolicyPreset;
  onPolicySelectionChange?: (value: "legacy" | FitPolicyPreset) => void;
};

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function renderPolicyValue(value: unknown, baseline: unknown, level: number): ReactNode {
  const changed = !valuesEqual(value, baseline);
  const highlighted = (content: ReactNode) =>
    changed ? (
      <span className="rounded bg-amber-900/60 px-0.5 text-amber-200">{content}</span>
    ) : (
      content
    );

  if (Array.isArray(value)) {
    return (
      <>
        [
        {value.map((item, index) => (
          <span key={index}>
            {index > 0 ? ", " : " "}
            {renderPolicyValue(
              item,
              Array.isArray(baseline) ? baseline[index] : undefined,
              level + 1,
            )}
          </span>
        ))}
        {value.length ? " " : ""}]
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const baselineRecord =
      typeof baseline === "object" && baseline !== null
        ? (baseline as Record<string, unknown>)
        : undefined;
    const entries = Object.entries(record);
    return (
      <>
        {"{\n"}
        {entries.map(([key, child], index) => (
          <span key={key}>
            {"  ".repeat(level + 1)}
            {JSON.stringify(key)}: {renderPolicyValue(child, baselineRecord?.[key], level + 1)}
            {index < entries.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"  ".repeat(level)}
        {"}"}
      </>
    );
  }

  return highlighted(JSON.stringify(value));
}

export function MapDebugOptions({
  showDebugCells,
  onShowDebugCellsChange,
  showNames,
  onShowNamesChange,
  showSprites,
  onShowSpritesChange,
  showCustomShapes,
  onShowCustomShapesChange,
  showFoundationOutlines,
  onShowFoundationOutlinesChange,
  showSignalLinks,
  onShowSignalLinksChange,
  showRawStructures,
  onShowRawStructuresChange,
  resetVersion,
  onReset,
  onLoadBlueprint,
  policySelection = "default",
  onPolicySelectionChange,
}: MapDebugOptionsProps) {
  const toggles = [
    <PersistentCheckbox
      boxed
      size="small"
      label="cells"
      storageKey={SHOW_DEBUG_CELLS_KEY}
      defaultChecked={showDebugCells}
      onCheckedChange={onShowDebugCellsChange}
      onInitialCheckedChange={onShowDebugCellsChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="names"
      storageKey={SHOW_NAMES_KEY}
      defaultChecked={showNames}
      onCheckedChange={onShowNamesChange}
      onInitialCheckedChange={onShowNamesChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="sprites"
      storageKey={SHOW_SPRITES_KEY}
      defaultChecked={showSprites}
      onCheckedChange={onShowSpritesChange}
      onInitialCheckedChange={onShowSpritesChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="shapes"
      storageKey={SHOW_CUSTOM_SHAPES_KEY}
      defaultChecked={showCustomShapes}
      onCheckedChange={onShowCustomShapesChange}
      onInitialCheckedChange={onShowCustomShapesChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="signals"
      storageKey={SHOW_SIGNAL_LINKS_KEY}
      defaultChecked={showSignalLinks}
      onCheckedChange={onShowSignalLinksChange}
      onInitialCheckedChange={onShowSignalLinksChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="outlines"
      storageKey={SHOW_FOUNDATION_OUTLINES_KEY}
      defaultChecked={showFoundationOutlines}
      onCheckedChange={onShowFoundationOutlinesChange}
      onInitialCheckedChange={onShowFoundationOutlinesChange}
      resetVersion={resetVersion}
    />,
    <PersistentCheckbox
      boxed
      size="small"
      label="structures"
      storageKey={SHOW_RAW_STRUCTURES_KEY}
      defaultChecked={showRawStructures}
      onCheckedChange={onShowRawStructuresChange}
      onInitialCheckedChange={onShowRawStructuresChange}
      resetVersion={resetVersion}
    />,
  ];

  return (
    <>
      <BlueprintMapSidebarSection
        title="Debug Options"
        collapsible
        storageKey={COLLAPSE_DEBUG_OPTIONS_KEY}
        headerAction={
          <IconButton size="small" label="Reset" onClick={onReset}>
            ↺
          </IconButton>
        }
      >
        <div className="flex flex-row flex-wrap gap-2">
          {toggles.map((toggle, index) => (
            <div key={index}>{toggle}</div>
          ))}
        </div>
      </BlueprintMapSidebarSection>
      <Divider className="my-4" />
      <BlueprintMapSidebarSection
        title="Policy Tester"
        collapsible
        storageKey={COLLAPSE_POLICY_TESTER_KEY}
      >
        <label className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Initial fit policy</span>
          <Select
            className="!min-h-0 !py-1 !px-2 text-xs"
            value={policySelection}
            onChange={(event) =>
              onPolicySelectionChange?.(event.target.value as "legacy" | FitPolicyPreset)
            }
          >
            <option value="legacy">legacy fallback</option>
            {Object.keys(FIT_POLICY_PRESETS).map((preset) => (
              <option key={preset} value={preset}>
                {preset} preset
              </option>
            ))}
          </Select>
        </label>
        <pre className="mt-3 overflow-auto text-[11px] leading-5 text-slate-500">
          {policySelection !== "legacy"
            ? renderPolicyValue(FIT_POLICY_PRESETS[policySelection], DEFAULT_FIT_POLICY, 0)
            : JSON.stringify({ mode: "legacy fallback" }, null, 2)}
        </pre>
        {policySelection !== "legacy" ? (
          <p className="mt-2 text-[10px] text-slate-500">
            Inherited values match the default policy.{" "}
            <span className="rounded bg-amber-900/60 px-0.5 text-amber-200">
              Highlighted values
            </span>{" "}
            are overrides.
          </p>
        ) : null}
      </BlueprintMapSidebarSection>
      <Divider className="my-4" />
      <BlueprintMapSidebarSection
        title="Test blueprints"
        collapsible
        storageKey={COLLAPSE_TEST_BLUEPRINTS_KEY}
      >
        <div className="grid gap-1.5">
          {BLUEPRINT_VISUAL_FIXTURES.map((fixture) => (
            <Button
              key={fixture.id}
              variant="quiet"
              className="w-full justify-start text-left text-xs !py-1.5 !px-2"
              onClick={() => onLoadBlueprint(fixture.blueprint)}
            >
              {fixture.label}
            </Button>
          ))}
        </div>
      </BlueprintMapSidebarSection>
      <Divider className="my-4" />
    </>
  );
}
