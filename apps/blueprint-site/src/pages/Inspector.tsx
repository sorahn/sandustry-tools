import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "@tanstack/react-router";
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
import { Panel, Select, StatusIndicator } from "@sandustry/ui";
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
import { type SaveBlueprintRecord } from "@sandustry/save-core";
import { encodeSavedBlueprint } from "../utils/save-blueprint";
import { extractSaveBlueprintsInWorker } from "../utils/save-blueprint-worker";
import {
  formatSaveOptgroupLabel,
  getSavedGameBytes,
  listSavedGames,
  subscribeToSaveDatabase,
  type StoredSaveSummary,
} from "../utils/save-db";
import { BLUEPRINT_VISUAL_FIXTURES } from "../visual-fixtures/catalog";

export function SavedBlueprintInspectorPage() {
  const { saveId, blueprintId } = useParams({ from: "/save/$saveId/blueprint/$blueprintId" });
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; encoded: string; name: string }
  >({ status: "loading" });

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      setState({ status: "loading" });
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(saveId) || !/^[A-Za-z0-9_-]{1,128}$/.test(blueprintId)) {
        if (!disposed)
          setState({ status: "error", message: "That saved blueprint link is not valid." });
        return;
      }
      const listed = await listSavedGames();
      if (disposed) return;
      if (!listed.ok) {
        setState({ status: "error", message: listed.error.message });
        return;
      }
      const summary = listed.value.find((candidate) => candidate.id === saveId);
      if (!summary) {
        setState({ status: "error", message: "That saved game is no longer available." });
        return;
      }
      const stored = await getSavedGameBytes(saveId);
      if (disposed) return;
      if (!stored.ok) {
        setState({
          status: "error",
          message: `The saved game is corrupt: ${stored.error.message}`,
        });
        return;
      }
      try {
        const extracted = await extractSaveBlueprintsInWorker(stored.value);
        if (disposed) return;
        const record = extracted.blueprints.find((candidate) => candidate.id === blueprintId);
        if (!record) {
          setState({
            status: "error",
            message: "That blueprint is not present in the saved game.",
          });
          return;
        }
        const encoded = encodeSavedBlueprint(record);
        setState({ status: "ready", encoded, name: summary.worldName || summary.fileName });
      } catch (error) {
        if (!disposed)
          setState({
            status: "error",
            message: `The saved blueprint is incompatible: ${error instanceof Error ? error.message : "unable to encode it"}`,
          });
      }
    };
    void load();
    return () => {
      disposed = true;
    };
  }, [blueprintId, saveId]);

  if (state.status === "loading")
    return <SavedBlueprintRouteState message="Loading the saved blueprint…" />;
  if (state.status === "error") return <SavedBlueprintRouteState message={state.message} error />;
  return (
    <BlueprintInspectorPage
      initialEncoded={state.encoded}
      title={`Blueprint from ${state.name}`}
      initialMessage="Loaded from a saved game."
    />
  );
}

function SavedBlueprintRouteState({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <section className="space-y-6">
      <PageHeader title="Saved Blueprint Inspector">{message}</PageHeader>
      <StatusIndicator tone={error ? "danger" : "warning"} label={message} />
    </section>
  );
}

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
  const [droppedSave, setDroppedSave] = useState<{
    fileName: string;
    blueprints: SaveBlueprintRecord[];
  } | null>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const inspectValue = (input: string) => {
    const value = input.trim();
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
  const inspect = () => inspectValue(encoded);
  const loadTestBlueprint = (nextBlueprint: Blueprint) => {
    const nextEncoded = encodeBlueprint(nextBlueprint);
    setDroppedSave(null);
    setEncoded(nextEncoded);
    setInspectedBlueprintKey(nextEncoded);
    setBlueprint(nextBlueprint);
    setSummary(summarizeBlueprint(nextEncoded, nextBlueprint));
    setMessage(`Loaded test blueprint ${nextBlueprint.name}.`);
    if (remember) writeStorageValue(SAVED_BLUEPRINT_KEY, nextEncoded);
  };
  const loadSavedBlueprint = (record: SaveBlueprintRecord, fileName: string) => {
    try {
      const nextEncoded = encodeSavedBlueprint(record);
      const nextBlueprint = decodeBlueprint(nextEncoded);
      setDroppedSave(null);
      setEncoded(nextEncoded);
      setInspectedBlueprintKey(nextEncoded);
      setBlueprint(nextBlueprint);
      setSummary(summarizeBlueprint(nextEncoded, nextBlueprint));
      setMessage(`Loaded ${record.name} from ${fileName}.`);
    } catch (error) {
      setMessage(
        `Unable to load ${record.name}: ${error instanceof Error ? error.message : "incompatible blueprint"}`,
      );
    }
  };
  const handleSaveFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.endsWith(".save")) {
      setMessage("Choose a Sandustry .save file.");
      return;
    }
    setMessage(`Reading ${file.name}…`);
    try {
      const extracted = await extractSaveBlueprintsInWorker(await file.arrayBuffer());
      if (!extracted.blueprints.length) {
        setDroppedSave(null);
        setMessage("That save contains no valid saved blueprints.");
        return;
      }
      if (extracted.blueprints.length === 1) {
        loadSavedBlueprint(extracted.blueprints[0], file.name);
        return;
      }
      setDroppedSave({ fileName: file.name, blueprints: extracted.blueprints });
      setMessage(`Choose one of the ${extracted.blueprints.length} saved blueprints.`);
    } catch (error) {
      setDroppedSave(null);
      setMessage(
        error instanceof Error ? `Unable to read save: ${error.message}` : "Unable to read save.",
      );
    }
  };
  useEffect(() => {
    if (initialEncoded !== undefined) {
      setEncoded(initialEncoded);
      inspectValue(initialEncoded);
    } else if (encoded.trim() && remember) {
      inspectValue(encoded);
    }
    // The initial or remembered value should be inspected after the page mounts.
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
      {initialEncoded === undefined ? <FromSavedGame onSelectFixture={loadTestBlueprint} /> : null}
      <SaveFileDropzone
        onFile={handleSaveFile}
        selection={droppedSave}
        onSelect={(record) => droppedSave && loadSavedBlueprint(record, droppedSave.fileName)}
      />
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
            />
          </div>
          <BlueprintStructuresPanel blueprint={blueprint} structureLabel={structureLabel} />
        </>
      ) : null}
    </section>
  );
}

function SaveFileDropzone({
  onFile,
  selection,
  onSelect,
}: {
  onFile: (file?: File) => void;
  selection: { fileName: string; blueprints: SaveBlueprintRecord[] } | null;
  onSelect: (record: SaveBlueprintRecord) => void;
}) {
  return (
    <Panel title="From .save file">
      <div
        className="space-y-3 p-4 text-sm text-slate-400"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          void onFile(event.dataTransfer.files[0]);
        }}
      >
        <label className="flex cursor-pointer items-center gap-3">
          <span className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200">
            Choose .save file
          </span>
          <span>or drop one here</span>
          <input
            type="file"
            accept=".save"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
        {selection ? (
          <label className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>{selection.fileName}</span>
            <Select
              defaultValue=""
              aria-label="Blueprint from dropped save"
              onChange={(event) => {
                const record = selection.blueprints.find(
                  (candidate) => candidate.id === event.target.value,
                );
                if (record) onSelect(record);
              }}
            >
              <option value="">Choose a blueprint…</option>
              {selection.blueprints.map((blueprint) => (
                <option key={blueprint.id} value={blueprint.id}>
                  {blueprint.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>
    </Panel>
  );
}

export function FromSavedGame({
  onSelectFixture,
}: {
  onSelectFixture?: (blueprint: Blueprint) => void;
}) {
  const [saved, setSaved] = useState<StoredSaveSummary[] | null>(null);
  const [message, setMessage] = useState("Loading saved blueprints…");
  useEffect(() => {
    const refresh = () => {
      void listSavedGames().then((result) => {
        if (!result.ok) {
          setMessage(result.error.message);
          return;
        }
        setSaved(result.value);
        setMessage(result.value.length ? "Choose a saved blueprint" : "No remembered saves yet.");
      });
    };
    refresh();
    return subscribeToSaveDatabase(refresh);
  }, []);
  const savesWithBlueprints = (saved ?? []).filter((save) => save.blueprints.length > 0);
  const hasSavedBlueprints = savesWithBlueprints.length > 0;
  const hasTestFixtures = Boolean(import.meta.env.DEV && BLUEPRINT_VISUAL_FIXTURES.length);
  const hasOptions = hasSavedBlueprints || hasTestFixtures;

  return (
    <Panel title="From saved game">
      <div className="p-4">
        {hasOptions ? (
          <label className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>Saved blueprint</span>
            <Select
              value=""
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                if (value.startsWith("fixture:")) {
                  const fixtureId = value.slice("fixture:".length);
                  const fixture = BLUEPRINT_VISUAL_FIXTURES.find(
                    (candidate) => candidate.id === fixtureId,
                  );
                  if (fixture) onSelectFixture?.(fixture.blueprint);
                  return;
                }
                const [saveId, blueprintId] = value.split("/");
                if (!saveId || !blueprintId) return;
                window.location.assign(
                  `${import.meta.env.BASE_URL}save/${encodeURIComponent(saveId)}/blueprint/${encodeURIComponent(blueprintId)}`,
                );
              }}
              aria-label="Saved blueprint"
            >
              <option value="">
                {hasSavedBlueprints ? "Choose a blueprint…" : "Choose a test fixture…"}
              </option>
              {hasTestFixtures ? (
                <optgroup label="Test Fixtures">
                  {BLUEPRINT_VISUAL_FIXTURES.map((fixture) => (
                    <option key={fixture.id} value={`fixture:${fixture.id}`}>
                      {fixture.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {savesWithBlueprints.map((save) => (
                <optgroup key={save.id} label={formatSaveOptgroupLabel(save)}>
                  {save.blueprints.map((blueprint) => (
                    <option key={`${save.id}/${blueprint.id}`} value={`${save.id}/${blueprint.id}`}>
                      {blueprint.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </label>
        ) : (
          <p className="text-sm text-slate-500">{message}</p>
        )}
      </div>
    </Panel>
  );
}
