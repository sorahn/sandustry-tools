import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import {
  clusterFilterStructures,
  prepareBlueprint,
  structureLabel,
  type FilterOverlayCluster,
} from "@daryl.roberts/sandustry-blueprint-core";
import {
  decodeBlueprint,
  encodeBlueprint,
  type Blueprint,
  type BlueprintType,
} from "../utils/blueprint";
import { debugComponent } from "../components/DebugComponentWrapper";
import { BlueprintMap } from "../components/BlueprintMap";
import { BlueprintInspectorSidebar } from "../components/BlueprintInspectorSidebar";
import { AppWorkspaceShell } from "../components/AppWorkspaceShell";
import { GlobalFileDropOverlay } from "../components/GlobalFileDropOverlay";
import { PersistentCheckbox } from "../components/PersistentCheckbox";
import {
  BlueprintSubmissionPanel,
  type BlueprintSummary,
} from "../components/BlueprintSubmissionPanel";
import {
  Button,
  Dialog,
  FileDropZone,
  Keycap,
  Panel,
  Select,
  ShortcutHelper,
  ShortcutHelperItem,
  Spinner,
  StatusIndicator,
} from "@sandustry/ui";
import { PageHeader } from "../components/PageHeader";
import {
  readStorageValue,
  readStoredBoolean,
  removeStorageValue,
  writeStorageValue,
  writeStoredBoolean,
} from "../utils/storage";
import {
  HIGHLIGHT_MATCHING_FILTERS_KEY,
  POLICY_TESTER_SELECTION_KEY,
  REMEMBER_BLUEPRINT_KEY,
  SAVED_BLUEPRINT_KEY,
  SAVED_MAP_VIEW_KEY,
  SHOW_FILTERS_KEY,
  SHOW_GRID_KEY,
  SHOW_MAP_SIDEBAR_KEY,
  SHOW_PNG_BACKGROUND_KEY,
} from "../utils/storage-keys";
import { FIT_POLICY_PRESETS, type FitPolicyPreset } from "../utils/blueprint-fit";
import { primaryModifierKey } from "../utils/platform";
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
  const router = useRouter();
  const { saveId, blueprintId } = useParams({ from: "/save/$saveId/blueprint/$blueprintId" });
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; encoded: string; name: string }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const routePath = router.state.location.pathname;
    const unsub = router.subscribe("onBeforeNavigate", (event) => {
      if (event.toLocation.pathname !== routePath) {
        controller.abort();
      }
    });
    const load = async () => {
      setState({ status: "loading" });
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(saveId) || !/^[A-Za-z0-9_-]{1,128}$/.test(blueprintId)) {
        if (!controller.signal.aborted)
          setState({ status: "error", message: "That saved blueprint link is not valid." });
        return;
      }
      const listed = await listSavedGames();
      if (controller.signal.aborted) return;
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
      if (controller.signal.aborted) return;
      if (!stored.ok) {
        setState({
          status: "error",
          message: `The saved game is corrupt: ${stored.error.message}`,
        });
        return;
      }
      try {
        const extracted = await extractSaveBlueprintsInWorker(stored.value, controller.signal);
        if (controller.signal.aborted) return;
        const record = extracted.blueprints.find((candidate) => candidate.id === blueprintId);
        if (!record) {
          setState({
            status: "error",
            message: "That blueprint is not present in the saved game.",
          });
          return;
        }
        const encoded = encodeSavedBlueprint(record);
        startTransition(() => {
          setState({ status: "ready", encoded, name: summary.worldName || summary.fileName });
        });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message: `The saved blueprint is incompatible: ${error instanceof Error ? error.message : "unable to encode it"}`,
          });
      }
    };
    void load();
    return () => {
      unsub();
      controller.abort();
    };
  }, [blueprintId, router, saveId]);

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
  const showMapSidebar = readStoredBoolean(SHOW_MAP_SIDEBAR_KEY, true);
  const [showGrid, setShowGrid] = useState(() => readStoredBoolean(SHOW_GRID_KEY, true));
  const [showPngBackground, setShowPngBackground] = useState(() =>
    readStoredBoolean(SHOW_PNG_BACKGROUND_KEY, false),
  );
  const [showFilters, setShowFilters] = useState(() => readStoredBoolean(SHOW_FILTERS_KEY, false));
  const [policySelection, setPolicySelection] = useState<"legacy" | FitPolicyPreset>(() => {
    const stored = readStorageValue(POLICY_TESTER_SELECTION_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(FIT_POLICY_PRESETS, stored)) {
      return stored as FitPolicyPreset;
    }
    return "vault";
  });
  const fitPolicy = policySelection === "legacy" ? undefined : FIT_POLICY_PRESETS[policySelection];
  const [inspectedBlueprintKey, setInspectedBlueprintKey] = useState("");
  const [summary, setSummary] = useState<BlueprintSummary | null>(null);
  const [message, setMessage] = useState(
    initialMessage ?? "Paste a v2 blueprint string to inspect it.",
  );
  const [droppedSave, setDroppedSave] = useState<{
    fileName: string;
    blueprints: SaveBlueprintRecord[];
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const userInitiatedRef = useRef(false);

  const router = useRouter();
  const fileDropAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // On mount / route arrival, defer heavy blueprint map rendering
    // until the header navigation transition completes (~200ms).
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timer = null;
      startTransition(() => setMapReady(true));
    }, 220);
    const routePath = router.state.location.pathname;
    const unsub = router.subscribe("onBeforeNavigate", (event) => {
      if (event.toLocation.pathname !== routePath) {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        fileDropAbortRef.current?.abort();
      }
    });
    return () => {
      unsub();
      if (timer !== null) {
        clearTimeout(timer);
      }
      fileDropAbortRef.current?.abort();
    };
  }, [router]);

  const inspectValue = (input: string, userInitiated = false) => {
    userInitiatedRef.current = userInitiated;
    if (userInitiated) setMapReady(true);
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

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const value = event.clipboardData?.getData("text/plain")?.trim();
      if (!value) return;
      try {
        decodeBlueprint(value);
      } catch {
        return;
      }

      event.preventDefault();
      setDroppedSave(null);
      setEncoded(value);
      if (remember) writeStorageValue(SAVED_BLUEPRINT_KEY, value);
      inspectValue(value, true);
      setImportOpen(false);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // inspectValue is intentionally kept local to this page's state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remember]);

  const inspect = () => inspectValue(encoded, true);
  const loadTestBlueprint = (nextBlueprint: Blueprint) => {
    userInitiatedRef.current = true;
    setMapReady(true);
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
      userInitiatedRef.current = true;
      setMapReady(true);
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
    fileDropAbortRef.current?.abort();
    const controller = new AbortController();
    fileDropAbortRef.current = controller;
    setMessage(`Reading ${file.name}…`);
    try {
      const buffer = await file.arrayBuffer();
      if (controller.signal.aborted) return;
      const extracted = await extractSaveBlueprintsInWorker(buffer, controller.signal);
      if (controller.signal.aborted) return;
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
      if (controller.signal.aborted) return;
      setDroppedSave(null);
      setMessage(
        error instanceof Error ? `Unable to read save: ${error.message}` : "Unable to read save.",
      );
    }
  };
  useEffect(() => {
    if (initialEncoded !== undefined) {
      setEncoded(initialEncoded);
      startTransition(() => {
        inspectValue(initialEncoded, false);
      });
    } else if (encoded.trim() && remember) {
      startTransition(() => {
        inspectValue(encoded, false);
      });
    }
    // The initial or remembered value should be inspected after the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEncoded]);
  useEffect(() => {
    if (!blueprint || !summary || !mapPanelRef.current) return;
    if (!userInitiatedRef.current) return;
    userInitiatedRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      const panel = mapPanelRef.current;
      if (!panel) return;
      const top = window.scrollY + panel.getBoundingClientRect().top - MAP_PANEL_SCROLL_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [blueprint, inspectedBlueprintKey, summary]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [highlightMatchingFilters, setHighlightMatchingFilters] = useState(() =>
    readStoredBoolean(HIGHLIGHT_MATCHING_FILTERS_KEY, false),
  );
  const handleHighlightMatchingFiltersChange = (value: boolean) => {
    setHighlightMatchingFilters(value);
    writeStoredBoolean(HIGHLIGHT_MATCHING_FILTERS_KEY, value);
  };

  const preparedBlueprint = useMemo(
    () => (blueprint ? prepareBlueprint(blueprint) : null),
    [blueprint],
  );
  const preparedStructure =
    blueprint && selectedIndex !== null && preparedBlueprint
      ? preparedBlueprint.preparedStructures[selectedIndex]
      : null;

  const { filterClusters, filterClusterByStructureIndex } = useMemo(() => {
    if (!preparedBlueprint) {
      return {
        filterClusters: [] as FilterOverlayCluster[],
        filterClusterByStructureIndex: new Map<number, FilterOverlayCluster>(),
      };
    }
    const clusters = clusterFilterStructures(preparedBlueprint.preparedStructures);
    const byIndex = new Map<number, FilterOverlayCluster>();
    for (const cluster of clusters) {
      for (const member of cluster.members) {
        byIndex.set(member.index, cluster);
      }
    }
    return { filterClusters: clusters, filterClusterByStructureIndex: byIndex };
  }, [preparedBlueprint]);

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
  const selectedStructure =
    blueprint && selectedIndex !== null ? blueprint.data[selectedIndex] : null;

  const copyString = async () => {
    if (!encoded) return;
    try {
      await navigator.clipboard.writeText(encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

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
  const navigate = useNavigate();

  if (blueprint && summary) {
    return (
      <AppWorkspaceShell
        sidebarTitle={blueprint.name}
        defaultSidebarCollapsed={!showMapSidebar}
        onSidebarCollapsedChange={(collapsed) =>
          writeStoredBoolean(SHOW_MAP_SIDEBAR_KEY, !collapsed)
        }
        sidebar={
          <BlueprintInspectorSidebar
            blueprint={blueprint}
            summary={summary}
            encoded={encoded}
            selected={selectedStructure}
            selectedIndex={selectedIndex}
            preparedStructure={preparedStructure}
            activeFilterCluster={activeFilterCluster}
            matchingFiltersCount={activeFilterCluster ? matchingFiltersCount : undefined}
            highlightMatchingFilters={highlightMatchingFilters}
            onHighlightMatchingFiltersChange={handleHighlightMatchingFiltersChange}
            onClearSelection={() => setSelectedIndex(null)}
            debugOptions={null}
            onOpenImport={() => setImportOpen(true)}
            onCopyString={() => void copyString()}
            copied={copied}
          />
        }
        statusBarProps={{
          left: (
            <span className="flex items-center gap-2 truncate">
              <span className="font-semibold text-[var(--sd-color-primary,#ffe700)] truncate max-w-xs">
                {blueprint.name}
              </span>
              <span className="text-[var(--sd-color-text-subtle,#808080)]">·</span>
              <span>{blueprint.data.length} structures</span>
              <span className="text-[var(--sd-color-text-subtle,#808080)]">·</span>
              <span>
                {summary.maxX - summary.minX + 1}×{summary.maxY - summary.minY + 1}
              </span>
              <span className="text-[var(--sd-color-text-subtle,#808080)]">·</span>
              <span className="font-semibold text-yellow-400">{summary.format}</span>
            </span>
          ),
          center: selectedStructure ? (
            <span>
              Selected: {structureLabel(selectedStructure.type)} ({selectedStructure.x},{" "}
              {selectedStructure.y})
            </span>
          ) : (
            <span>{message}</span>
          ),
        }}
        overlays={
          <>
            <GlobalFileDropOverlay onFileDrop={(file) => void handleSaveFile(file)} />
            <Dialog
              open={importOpen}
              onClose={() => setImportOpen(false)}
              title="Import Blueprint or Save"
            >
              <div className="space-y-4 p-4">
                {initialEncoded === undefined ? (
                  <FromSavedGame
                    onSelectFixture={(fixture) => {
                      loadTestBlueprint(fixture);
                      setImportOpen(false);
                    }}
                    onSelectSavedBlueprint={(saveId, blueprintId) => {
                      setImportOpen(false);
                      navigate({
                        to: "/save/$saveId/blueprint/$blueprintId",
                        params: { saveId, blueprintId },
                      });
                    }}
                  />
                ) : null}
                <SaveFileDropzone
                  onFile={(file) => {
                    void handleSaveFile(file);
                  }}
                  selection={droppedSave}
                  onSelect={(record) => {
                    if (droppedSave) {
                      loadSavedBlueprint(record, droppedSave.fileName);
                      setImportOpen(false);
                    }
                  }}
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
                  onInspect={() => {
                    inspect();
                    setImportOpen(false);
                  }}
                />
              </div>
            </Dialog>
          </>
        }
      >
        {/* Floating Canvas View Controls */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded border border-slate-700/80 bg-slate-950/80 p-1.5 backdrop-blur shadow-md">
          <Button
            size="small"
            variant="quiet"
            onClick={() => setImportOpen(true)}
            className="text-xs"
          >
            Change blueprint
          </Button>
        </div>

        <div className="absolute bottom-1 left-3 z-30">
          <ShortcutHelper>
            <ShortcutHelperItem
              hotkey={
                <>
                  <Keycap size="sm">{primaryModifierKey()}</Keycap>
                  <span className="text-white/50">+</span>
                  <Keycap size="sm">V</Keycap>
                </>
              }
              label="Paste blueprint"
            />
          </ShortcutHelper>
        </div>

        {mapReady ? (
          <BlueprintMap
            blueprint={blueprint}
            remember={remember}
            blueprintKey={inspectedBlueprintKey}
            showSidebar={showMapSidebar}
            showGrid={showGrid}
            showPngBackground={showPngBackground}
            showFilters={showFilters}
            fitPolicy={fitPolicy}
            policySelection={policySelection}
            onPolicySelectionChange={(selection) => {
              setPolicySelection(selection);
              writeStorageValue(POLICY_TESTER_SELECTION_KEY, selection);
            }}
            fullHeight
            externalSidebar
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            highlightMatchingFilters={highlightMatchingFilters}
            onHighlightMatchingFiltersChange={handleHighlightMatchingFiltersChange}
            viewportControlsExtra={
              <>
                <PersistentCheckbox
                  boxed
                  size="small"
                  label="filters"
                  storageKey={SHOW_FILTERS_KEY}
                  defaultChecked={showFilters}
                  onCheckedChange={setShowFilters}
                />
                <PersistentCheckbox
                  boxed
                  size="small"
                  label="grid"
                  storageKey={SHOW_GRID_KEY}
                  defaultChecked={showGrid}
                  onCheckedChange={setShowGrid}
                />
                <PersistentCheckbox
                  boxed
                  size="small"
                  label="PNG: blue"
                  storageKey={SHOW_PNG_BACKGROUND_KEY}
                  defaultChecked={showPngBackground}
                  onCheckedChange={setShowPngBackground}
                />
              </>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <div className="flex items-center gap-2.5 font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
              <Spinner size="small" />
              <span>Rendering blueprint map…</span>
            </div>
          </div>
        )}
      </AppWorkspaceShell>
    );
  }

  return (
    <AppWorkspaceShell
      sidebarTitle="Blueprint Inspector"
      statusBarProps={{ left: <span>{message}</span> }}
      overlays={<GlobalFileDropOverlay onFileDrop={(file) => void handleSaveFile(file)} />}
    >
      <div className="flex h-full w-full overflow-y-auto p-6 md:p-10 justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <PageHeader title={title}>{description}</PageHeader>
          {initialEncoded === undefined ? (
            <FromSavedGame
              onSelectFixture={loadTestBlueprint}
              onSelectSavedBlueprint={(saveId, blueprintId) =>
                navigate({
                  to: "/save/$saveId/blueprint/$blueprintId",
                  params: { saveId, blueprintId },
                })
              }
            />
          ) : null}
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
        </div>
      </div>
    </AppWorkspaceShell>
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
    <Panel title="From .save file" padded>
      <FileDropZone
        accept=".save"
        onFile={(file) => void onFile(file)}
        className="space-y-3 rounded border border-dashed border-slate-700/80 p-4 text-sm text-slate-400 transition-colors"
        activeClassName="border-yellow-400/70 bg-amber-900/20"
      >
        {({ openFileDialog }) => (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-yellow-400/70 hover:text-white focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                onClick={openFileDialog}
              >
                Choose .save file
              </button>
              <span>or drop one here</span>
            </div>
            {selection ? (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
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
              </div>
            ) : null}
          </>
        )}
      </FileDropZone>
    </Panel>
  );
}

export function FromSavedGame({
  onSelectFixture,
  onSelectSavedBlueprint,
}: {
  onSelectFixture?: (blueprint: Blueprint) => void;
  onSelectSavedBlueprint?: (saveId: string, blueprintId: string) => void;
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
    <Panel title="From saved game" padded>
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
              if (onSelectSavedBlueprint) {
                onSelectSavedBlueprint(saveId, blueprintId);
                return;
              }
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
    </Panel>
  );
}
