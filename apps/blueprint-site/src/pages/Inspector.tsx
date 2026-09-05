import { useEffect, useRef, useState, type ReactNode } from "react";
import { structureLabel } from "@daryl.roberts/sandustry-blueprint-core";
import {
  decodeBlueprint,
  encodeBlueprint,
  type Blueprint,
  type BlueprintType,
} from "../utils/blueprint";
import { debugComponent } from "../components/DebugComponentWrapper";
import { BlueprintMapPanel } from "../components/BlueprintMapPanel";
import { PersistentCheckbox } from "../components/PersistentCheckbox";
import {
  BlueprintSubmissionPanel,
  type BlueprintSummary,
} from "../components/BlueprintSubmissionPanel";
import { BlueprintStructuresPanel } from "../components/BlueprintStructuresPanel";
import { PageHeader } from "../components/PageHeader";
import {
  readStorageValue,
  readStoredBoolean,
  removeStorageValue,
  writeStorageValue,
} from "../utils/storage";
import {
  REMEMBER_BLUEPRINT_KEY,
  SAVED_BLUEPRINT_KEY,
  SAVED_MAP_VIEW_KEY,
  SHOW_FILTERS_KEY,
  SHOW_GRID_KEY,
  SHOW_MAP_SIDEBAR_KEY,
  SHOW_PNG_BACKGROUND_KEY,
} from "../utils/storage-keys";

function summarizeBlueprint(input: string, blueprint: Blueprint): BlueprintSummary {
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  let filterCount = 0;
  let dataCount = 0;
  const types = new Set<BlueprintType>();
  let numericTypes = 0;

  if (blueprint.data.length) {
    const first = blueprint.data[0];
    minX = first.x;
    maxX = first.x;
    minY = first.y;
    maxY = first.y;

    for (let i = 0; i < blueprint.data.length; i++) {
      const item = blueprint.data[i];
      if (item.x < minX) minX = item.x;
      if (item.x > maxX) maxX = item.x;
      if (item.y < minY) minY = item.y;
      if (item.y > maxY) maxY = item.y;
      if (item.filter !== undefined) filterCount++;
      if (item.data !== undefined) dataCount++;
      if (!types.has(item.type)) {
        types.add(item.type);
        if (typeof item.type === "number") numericTypes++;
      }
    }
  }

  return {
    format: input.trim().startsWith("SAND:BP:v2t:") ? "v2 text" : "v2 binary",
    minX,
    maxX,
    minY,
    maxY,
    types: types.size,
    numericTypes,
    stringTypes: types.size - numericTypes,
    filters: filterCount,
    dataRecords: dataCount,
    links: blueprint.signalLinks?.length ?? 0,
  };
}

const MAP_PANEL_SCROLL_OFFSET = 16;
type BlueprintInspectorPageProps = {
  initialEncoded?: string;
  title?: string;
  description?: ReactNode;
  initialMessage?: string;
};

export function BlueprintInspectorPage({
  initialEncoded,
  title = "Blueprint Inspector",
  description = (
    <>
      Inspect your Sandustry blueprints here. <br />
      Browse and share your prints with the community at the{" "}
      <a rel="noopener noreferrer" target="_blank" href="https://sandustryvault.com/">
        Sandustry Vault
      </a>
      !
    </>
  ),
  initialMessage,
}: BlueprintInspectorPageProps = {}) {
  const [remember, setRemember] = useState(
    () => readStorageValue(REMEMBER_BLUEPRINT_KEY) === "true",
  );
  const [encoded, setEncoded] = useState(() => {
    if (initialEncoded !== undefined) return initialEncoded;
    if (readStorageValue(REMEMBER_BLUEPRINT_KEY) !== "true") {
      return "";
    }
    return readStorageValue(SAVED_BLUEPRINT_KEY) ?? "";
  });
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [showMapSidebar, setShowMapSidebar] = useState(() =>
    readStoredBoolean(SHOW_MAP_SIDEBAR_KEY, true),
  );
  const [showGrid, setShowGrid] = useState(() => readStoredBoolean(SHOW_GRID_KEY, true));
  const [showPngBackground, setShowPngBackground] = useState(() =>
    readStoredBoolean(SHOW_PNG_BACKGROUND_KEY, false),
  );
  const [showFilters, setShowFilters] = useState(() => readStoredBoolean(SHOW_FILTERS_KEY, false));
  const [inspectedBlueprintKey, setInspectedBlueprintKey] = useState("");
  const [summary, setSummary] = useState<BlueprintSummary | null>(null);
  const [message, setMessage] = useState(
    initialMessage ?? "Paste a v2 blueprint string to inspect it.",
  );
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const inspect = () => {
    const value = encoded.trim();
    if (value.startsWith("SAND:BP:v1:") || value.startsWith("SAND:BACKUP:v1:")) {
      setBlueprint(null);
      setSummary(null);
      setMessage(
        "Legacy v1 strings are available in the codec, but are not supported by the renderer inspector.",
      );
      return;
    }
    try {
      const decoded = decodeBlueprint(value);
      setBlueprint(decoded);
      setInspectedBlueprintKey(value);
      setSummary(summarizeBlueprint(value, decoded));
      setMessage(`Inspected ${decoded.data.length} structure(s) from ${decoded.name}.`);
    } catch (error) {
      setBlueprint(null);
      setSummary(null);
      setMessage(error instanceof Error ? error.message : "Unable to inspect blueprint.");
    }
  };
  const loadTestBlueprint = (nextBlueprint: Blueprint) => {
    const nextEncoded = encodeBlueprint(nextBlueprint);
    setEncoded(nextEncoded);
    setInspectedBlueprintKey(nextEncoded);
    setBlueprint(nextBlueprint);
    setSummary(summarizeBlueprint(nextEncoded, nextBlueprint));
    setMessage(`Loaded test blueprint ${nextBlueprint.name}.`);
    if (remember) writeStorageValue(SAVED_BLUEPRINT_KEY, nextEncoded);
  };
  useEffect(() => {
    if (encoded.trim() && (initialEncoded !== undefined || remember)) inspect();
    // The initial value should be inspected once after the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEncoded]);
  useEffect(() => {
    if (!blueprint || !summary || !mapPanelRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = mapPanelRef.current;
      if (!panel) return;
      const top = window.scrollY + panel.getBoundingClientRect().top - MAP_PANEL_SCROLL_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [blueprint, inspectedBlueprintKey, summary]);
  const rememberHeader = debugComponent(PersistentCheckbox, {
    boxed: true,
    defaultChecked: remember,
    storageKey: REMEMBER_BLUEPRINT_KEY,
    label: "remember",
    size: "small",
    onCheckedChange: (nextRemember: boolean) => {
      setRemember(nextRemember);
      if (nextRemember) writeStorageValue(SAVED_BLUEPRINT_KEY, encoded);
      else {
        removeStorageValue(SAVED_BLUEPRINT_KEY);
        removeStorageValue(SAVED_MAP_VIEW_KEY);
      }
    },
  });
  return (
    <section className="space-y-6">
      <PageHeader title={title}>{description}</PageHeader>
      <BlueprintSubmissionPanel
        encoded={encoded}
        message={message}
        rememberHeader={rememberHeader}
        summary={summary}
        blueprint={blueprint}
        onEncodedChange={(value) => {
          setEncoded(value);
          if (remember) writeStorageValue(SAVED_BLUEPRINT_KEY, value);
        }}
        onClear={() => {
          setEncoded("");
          if (remember) writeStorageValue(SAVED_BLUEPRINT_KEY, "");
        }}
        onInspect={inspect}
      />
      {blueprint && summary ? (
        <>
          <div ref={mapPanelRef} className="scroll-mt-4">
            <BlueprintMapPanel
              blueprint={blueprint}
              remember={remember}
              blueprintKey={inspectedBlueprintKey}
              showSidebar={showMapSidebar}
              onShowSidebarChange={setShowMapSidebar}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              showPngBackground={showPngBackground}
              onShowPngBackgroundChange={setShowPngBackground}
              showFilters={showFilters}
              onShowFiltersChange={setShowFilters}
              onLoadBlueprint={loadTestBlueprint}
            />
          </div>
          <BlueprintStructuresPanel blueprint={blueprint} structureLabel={structureLabel} />
        </>
      ) : null}
    </section>
  );
}
