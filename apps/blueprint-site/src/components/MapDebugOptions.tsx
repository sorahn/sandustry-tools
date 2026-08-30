import { PersistentCheckbox } from "./PersistentCheckbox";
import { BlueprintMapSidebarSection } from "./BlueprintMapSidebarSection";
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
import { FIT_POLICY_PRESETS, type FitPolicyPreset } from "../utils/blueprint-fit";
import { Divider, IconButton } from "@sandustry/ui";
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
          <select
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"
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
          </select>
        </label>
        <pre className="mt-3 overflow-auto text-[11px] leading-5 text-slate-500">
          {JSON.stringify(
            policySelection !== "legacy"
              ? { preset: policySelection, policy: FIT_POLICY_PRESETS[policySelection] }
              : { mode: "legacy fallback" },
            null,
            2,
          )}
        </pre>
      </BlueprintMapSidebarSection>
      <Divider className="my-4" />
      <BlueprintMapSidebarSection
        title="Test blueprints"
        collapsible
        storageKey={COLLAPSE_TEST_BLUEPRINTS_KEY}
      >
        <div className="grid gap-2">
          {BLUEPRINT_VISUAL_FIXTURES.map((fixture) => (
            <button
              key={fixture.id}
              type="button"
              className="rounded border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              onClick={() => onLoadBlueprint(fixture.blueprint)}
            >
              {fixture.label}
            </button>
          ))}
        </div>
      </BlueprintMapSidebarSection>
      <Divider className="my-4" />
    </>
  );
}
