import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MinimapRenderOptions,
  SaveExplorerCellInspection,
  SaveExplorerClientDocument,
} from "@sandustry/save-core";
import { PageHeader } from "../components/PageHeader";
import { SplitPane } from "@sandustry/ui";
import {
  SaveExplorerMapPanel,
  type ExplorerDrag,
  type ExplorerRaster,
  type ExplorerView,
} from "../components/SaveExplorerMapPanel";
import { SaveExplorerSidebar, type SaveExplorerLayers } from "../components/SaveExplorerSidebar";
import { readRememberedSave } from "../utils/save-storage";
import { readStorageValue, writeStoredBoolean } from "../utils/storage";
import { REMEMBER_SAVE_EXPLORER_KEY } from "../utils/storage-keys";
import {
  getSavedGameBytes,
  listSavedGames,
  migrateLegacyRememberedSave,
  readActiveSaveId,
  storeSave,
  subscribeToSaveDatabase,
  type StoredSaveSummary,
} from "../utils/save-db";
import { copyToClipboard } from "../utils/clipboard";

import type { SaveWorkerResponse } from "../save-worker";

function storedSummary(document: SaveExplorerClientDocument, fileName: string): StoredSaveSummary {
  return {
    id: document.metadata.saveId,
    fileName,
    saveName: document.metadata.saveName,
    worldName: document.metadata.worldName,
    playTime: document.metadata.playTime,
    saveTimestamp: document.metadata.timestamp,
    storedAt: new Date().toISOString(),
    gameVersion: document.metadata.gameVersion,
    factoryLevel: document.metadata.factoryLevel,
    productionPoints: document.metadata.productionPoints,
    resources: document.metadata.resources,
    structureCount: document.structureCount,
    blueprintCount: document.blueprints.length,
    byteLength: 0,
    blueprints: document.blueprints,
  };
}

export function SaveExplorerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const dragRef = useRef<ExplorerDrag | null>(null);
  const fitNextRasterRef = useRef(true);
  const fitMapRef = useRef<() => void>(() => {});
  const nextRequestIdRef = useRef(1);
  const activeDecodeIdRef = useRef(0);
  const latestInspectIdRef = useRef(0);
  const latestRenderIdRef = useRef(0);
  const latestEncodeIdRef = useRef(0);
  const loadIntentRef = useRef(0);
  const pendingInspectRef = useRef<{ mapX: number; mapY: number } | null>(null);
  const inspectFrameRef = useRef<number | null>(null);
  const [document, setDocument] = useState<SaveExplorerClientDocument | null>(null);
  const [raster, setRaster] = useState<ExplorerRaster | null>(null);
  const [inspection, setInspection] = useState<SaveExplorerCellInspection | null>(null);
  const [hoverCell, setHoverCell] = useState<{ mapX: number; mapY: number } | null>(null);
  const hoverCellRef = useRef<{ mapX: number; mapY: number } | null>(null);
  const [message, setMessage] = useState("Drop a .save file here to begin.");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(
    () => readStorageValue(REMEMBER_SAVE_EXPLORER_KEY) === "true",
  );
  const [dragging, setDragging] = useState(false);
  const [layers, setLayers] = useState<SaveExplorerLayers>({
    terrain: true,
    settledElements: true,
    elements: true,
    particles: true,
    walls: true,
    structures: true,
    fog: true,
    authorization: false,
  });
  const [customCursor, setCustomCursor] = useState(false);
  const currentSaveRef = useRef<{
    bytes: Uint8Array;
    name: string;
    source: "upload" | "stored" | "legacy";
    persistOnDecode: boolean;
  } | null>(null);
  const activeSaveIdRef = useRef<string | null>(null);
  const currentSaveIdRef = useRef<string | null>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const [view, setView] = useState<ExplorerView>({ scale: 1, offsetX: 0, offsetY: 0 });

  const minimapOptions: MinimapRenderOptions = {
    drawTerrain: layers.terrain,
    drawSettledElements: layers.settledElements,
    drawElements: layers.elements,
    drawParticles: layers.particles,
    drawWalls: layers.walls,
    drawStructures: layers.structures,
    drawFog: layers.fog,
    drawAuthorization: layers.authorization,
  };

  const isFittedRef = useRef(true);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const awaitingSettleRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fitMap = useCallback(() => {
    const frame = mapFrameRef.current;
    if (!frame || !raster || frame.clientWidth <= 32 || frame.clientHeight <= 32) return;
    isFittedRef.current = true;
    const scale = Math.max(
      0.25,
      Math.min(
        8,
        Math.min(
          (frame.clientWidth - 32) / raster.width,
          (frame.clientHeight - 32) / raster.height,
        ),
      ),
    );
    const nextOffsetX = (frame.clientWidth - raster.width * scale) / 2;
    const nextOffsetY = (frame.clientHeight - raster.height * scale) / 2;
    setView((current) => {
      if (
        Math.abs(current.scale - scale) < 0.0001 &&
        Math.abs(current.offsetX - nextOffsetX) < 0.1 &&
        Math.abs(current.offsetY - nextOffsetY) < 0.1
      ) {
        return current;
      }
      return {
        scale,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
      };
    });
  }, [raster]);

  const handleViewChange = useCallback(
    (nextView: ExplorerView | ((current: ExplorerView) => ExplorerView)) => {
      isFittedRef.current = false;
      setView(nextView);
    },
    [],
  );

  useEffect(() => {
    fitMapRef.current = fitMap;
  }, [fitMap]);

  useEffect(() => {
    const worker = new Worker(new URL("../save-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<SaveWorkerResponse>) => {
      const response = event.data;
      const respId = response.id ?? 0;

      if (response.type === "inspection") {
        if (respId !== latestInspectIdRef.current || respId < activeDecodeIdRef.current) return;
        const current = hoverCellRef.current;
        if (
          response.inspection &&
          current?.mapX === response.inspection.mapX &&
          current.mapY === response.inspection.mapY
        )
          setInspection(response.inspection);
        return;
      }

      if (response.type === "encoded") {
        if (respId !== latestEncodeIdRef.current || respId < activeDecodeIdRef.current) return;
        void copyToClipboard(response.encoded).then((copied) => {
          if (respId !== latestEncodeIdRef.current || respId < activeDecodeIdRef.current) return;
          setMessage(
            copied
              ? "Blueprint string copied to the clipboard."
              : "Unable to copy blueprint string.",
          );
        });
        return;
      }

      if (response.type === "error") {
        if (response.operation === "inspect") {
          if (respId === latestInspectIdRef.current && respId >= activeDecodeIdRef.current) {
            setInspection(null);
            setMessage(`Unable to inspect cell: ${response.message}`);
          }
          return;
        }
        if (response.operation === "encode") {
          if (respId === latestEncodeIdRef.current && respId >= activeDecodeIdRef.current)
            setMessage(`Unable to encode blueprint: ${response.message}`);
          return;
        }
        if (response.operation === "decode" && respId !== activeDecodeIdRef.current) return;
        if (response.operation === "render" && respId !== latestRenderIdRef.current) return;
        setBusy(false);
        if (response.operation === "decode") {
          setDocument(null);
          setRaster(null);
        }
        setMessage(response.message);
        return;
      }

      if (response.type === "rendered") {
        if (respId !== latestRenderIdRef.current || respId < activeDecodeIdRef.current) return;
        setBusy(false);
      }
      if (response.type === "decoded") {
        if (respId !== activeDecodeIdRef.current) return;
        setDocument(response.document);
        activeSaveIdRef.current = response.document.metadata.saveId;
        currentSaveIdRef.current = response.document.metadata.saveId;
        awaitingSettleRef.current = true;
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
        }
        settleTimerRef.current = setTimeout(() => {
          settleTimerRef.current = null;
          awaitingSettleRef.current = false;
          fitMapRef.current();
          requestAnimationFrame(() => {
            setBusy(false);
          });
        }, 200);
      }
      setRaster({
        width: response.raster.width,
        height: response.raster.height,
        pixels: new Uint8ClampedArray(response.raster.pixels),
      });
      setMessage(
        response.type === "decoded"
          ? "Save decoded. This first view is a native-style minimap raster."
          : "Minimap layer updated.",
      );
      if (response.type === "decoded" && currentSaveRef.current) {
        const current = currentSaveRef.current;
        const summary = storedSummary(response.document, current.name);
        summary.byteLength = current.bytes.byteLength;
        if (current.source === "legacy") {
          void migrateLegacyRememberedSave(current.bytes, summary).then((result) => {
            if (activeDecodeIdRef.current !== respId) return;
            if (!result.ok)
              setMessage(`Save decoded, but migration failed: ${result.error.message}`);
            else current.persistOnDecode = false;
          });
        } else if (current.persistOnDecode) {
          void storeSave(current.bytes, summary).then((result) => {
            if (activeDecodeIdRef.current !== respId) return;
            if (!result.ok) setMessage(`Save decoded, but saving failed: ${result.error.message}`);
            else current.persistOnDecode = false;
          });
        }
      }
    };
    worker.onerror = () => {
      setBusy(false);
      setMessage("The save worker stopped unexpectedly.");
    };
    let disposed = false;
    void (async () => {
      const intent = ++loadIntentRef.current;
      let saved:
        | {
            bytes: Uint8Array;
            name: string;
            saveId?: string;
            source: "stored" | "legacy";
          }
        | undefined;
      const legacy = readRememberedSave();
      if (legacy) {
        saved = { bytes: legacy.bytes.slice(), name: legacy.name, source: "legacy" };
      } else {
        const listed = await listSavedGames();
        if (disposed || intent !== loadIntentRef.current) return;
        if (listed.ok && listed.value.length > 0) {
          const sorted = listed.value.slice().sort((a, b) => b.storedAt.localeCompare(a.storedAt));
          const activeId = readActiveSaveId();
          const summary = sorted.find((candidate) => candidate.id === activeId) ?? sorted[0];
          const bytes = await getSavedGameBytes(summary.id);
          if (disposed || intent !== loadIntentRef.current) return;
          if (bytes.ok)
            saved = {
              bytes: bytes.value,
              name: summary.fileName,
              saveId: summary.id,
              source: "stored",
            };
          else setMessage(bytes.error.message);
        } else if (!listed.ok) {
          setMessage(listed.error.message);
        }
      }
      if (disposed || intent !== loadIntentRef.current || !saved) return;
      activeSaveIdRef.current = saved.saveId ?? null;
      currentSaveIdRef.current = saved.saveId ?? null;
      currentSaveRef.current = {
        bytes: saved.bytes.slice(),
        name: saved.name,
        source: saved.source,
        persistOnDecode: saved.source === "legacy",
      };
      setBusy(true);
      setMessage(`Restoring ${saved.name}…`);
      awaitingSettleRef.current = true;
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      fitNextRasterRef.current = true;
      const reqId = nextRequestIdRef.current++;
      activeDecodeIdRef.current = reqId;
      latestRenderIdRef.current = reqId;
      const bytes = saved.bytes.buffer;
      worker.postMessage({ id: reqId, type: "decode", bytes, render: minimapOptions }, [bytes]);
    })();
    const clearExplorerState = () => {
      loadIntentRef.current += 1;
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      awaitingSettleRef.current = false;
      setBusy(false);
      fitNextRasterRef.current = false;
      activeSaveIdRef.current = null;
      currentSaveIdRef.current = null;
      currentSaveRef.current = null;
      setDocument(null);
      setRaster(null);
      setInspection(null);
      setHoverCell(null);
      cancelQueuedInspect();
      setMessage("Choose a Sandustry .save file.");
    };
    const unsubscribe = subscribeToSaveDatabase(async (event) => {
      if (disposed) return;
      if (event.type === "active-save-changed") {
        if (!event.saveId) {
          clearExplorerState();
          return;
        }
        if (event.saveId === activeSaveIdRef.current) return;
        const intent = ++loadIntentRef.current;
        activeSaveIdRef.current = event.saveId;
        currentSaveIdRef.current = event.saveId;
        setBusy(true);
        setDocument(null);
        setInspection(null);
        setHoverCell(null);
        cancelQueuedInspect();
        const bytes = await getSavedGameBytes(event.saveId);
        if (
          disposed ||
          intent !== loadIntentRef.current ||
          event.saveId !== activeSaveIdRef.current
        )
          return;
        if (!bytes.ok) {
          setBusy(false);
          setMessage(bytes.error.message);
          return;
        }
        const listed = await listSavedGames();
        if (
          disposed ||
          intent !== loadIntentRef.current ||
          event.saveId !== activeSaveIdRef.current
        )
          return;
        const summary = listed.ok ? listed.value.find((s) => s.id === event.saveId) : undefined;
        const fileName = summary?.fileName ?? "save.save";
        currentSaveRef.current = {
          bytes: bytes.value.slice(),
          name: fileName,
          source: "stored",
          persistOnDecode: false,
        };
        setMessage(`Restoring ${fileName}…`);
        awaitingSettleRef.current = true;
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        fitNextRasterRef.current = true;
        const reqId = nextRequestIdRef.current++;
        activeDecodeIdRef.current = reqId;
        latestRenderIdRef.current = reqId;
        const buffer = bytes.value.buffer;
        const currentLayers = layersRef.current;
        const renderOpts: MinimapRenderOptions = {
          drawTerrain: currentLayers.terrain,
          drawSettledElements: currentLayers.settledElements,
          drawElements: currentLayers.elements,
          drawParticles: currentLayers.particles,
          drawWalls: currentLayers.walls,
          drawStructures: currentLayers.structures,
          drawFog: currentLayers.fog,
          drawAuthorization: currentLayers.authorization,
        };
        workerRef.current?.postMessage(
          { id: reqId, type: "decode", bytes: buffer, render: renderOpts },
          [buffer],
        );
      } else if (event.type === "save-deleted") {
        if (event.saveId === activeSaveIdRef.current || event.saveId === currentSaveIdRef.current) {
          clearExplorerState();
        }
      }
    });
    return () => {
      disposed = true;
      unsubscribe();
      if (inspectFrameRef.current !== null) cancelAnimationFrame(inspectFrameRef.current);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !raster) return;
    canvas.width = raster.width;
    canvas.height = raster.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    let imageData: ImageData;
    try {
      imageData = new ImageData(
        raster.pixels as Uint8ClampedArray<ArrayBuffer>,
        raster.width,
        raster.height,
      );
    } catch {
      imageData = context.createImageData(raster.width, raster.height);
      imageData.data.set(raster.pixels);
    }
    context.putImageData(imageData, 0, 0);
    if (isFittedRef.current) {
      fitMap();
    }
  }, [fitMap, raster]);

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width === lastSizeRef.current.width && height === lastSizeRef.current.height) {
        return;
      }
      lastSizeRef.current = { width, height };
      if (isFittedRef.current) {
        fitMapRef.current();
      }
      if (awaitingSettleRef.current) {
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
        }
        settleTimerRef.current = setTimeout(() => {
          settleTimerRef.current = null;
          awaitingSettleRef.current = false;
          fitMapRef.current();
          requestAnimationFrame(() => {
            setBusy(false);
          });
        }, 200);
      }
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;
    const preventPageScroll = (event: WheelEvent) => event.preventDefault();
    frame.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => frame.removeEventListener("wheel", preventPageScroll);
  }, []);

  const decodeFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.endsWith(".save")) {
      setMessage("Choose a Sandustry .save file.");
      return;
    }
    const intent = ++loadIntentRef.current;
    setBusy(true);
    setDocument(null);
    setInspection(null);
    setHoverCell(null);
    cancelQueuedInspect();
    setMessage(`Reading ${file.name}…`);
    awaitingSettleRef.current = true;
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    fitNextRasterRef.current = true;
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch (error) {
      if (intent !== loadIntentRef.current) return;
      setBusy(false);
      awaitingSettleRef.current = false;
      setMessage(error instanceof Error ? error.message : `Unable to read ${file.name}.`);
      return;
    }
    if (intent !== loadIntentRef.current) return;
    const reqId = nextRequestIdRef.current++;
    activeDecodeIdRef.current = reqId;
    latestRenderIdRef.current = reqId;
    currentSaveRef.current = {
      bytes: bytes.slice(),
      name: file.name,
      source: "upload",
      persistOnDecode: remember,
    };
    workerRef.current?.postMessage(
      { id: reqId, type: "decode", bytes: bytes.buffer, render: minimapOptions },
      [bytes.buffer],
    );
  };

  const updateLayer = (layer: keyof SaveExplorerLayers, checked: boolean) => {
    const next = { ...layers, [layer]: checked };
    setLayers(next);
    if (document) {
      const reqId = nextRequestIdRef.current++;
      latestRenderIdRef.current = reqId;
      workerRef.current?.postMessage({
        id: reqId,
        type: "render",
        render: {
          drawTerrain: next.terrain,
          drawSettledElements: next.settledElements,
          drawElements: next.elements,
          drawParticles: next.particles,
          drawWalls: next.walls,
          drawStructures: next.structures,
          drawFog: next.fog,
          drawAuthorization: next.authorization,
        },
      });
    }
  };

  const queueInspect = (mapX: number, mapY: number) => {
    pendingInspectRef.current = { mapX, mapY };
    if (inspectFrameRef.current !== null) return;
    inspectFrameRef.current = requestAnimationFrame(() => {
      inspectFrameRef.current = null;
      const cell = pendingInspectRef.current;
      pendingInspectRef.current = null;
      if (!cell) return;
      const reqId = nextRequestIdRef.current++;
      latestInspectIdRef.current = reqId;
      workerRef.current?.postMessage({ id: reqId, type: "inspect", ...cell });
    });
  };

  const cancelQueuedInspect = () => {
    pendingInspectRef.current = null;
    if (inspectFrameRef.current !== null) {
      cancelAnimationFrame(inspectFrameRef.current);
      inspectFrameRef.current = null;
    }
  };

  const toggleRemember = async () => {
    if (remember) {
      setRemember(false);
      writeStoredBoolean(REMEMBER_SAVE_EXPLORER_KEY, false);
      setMessage("New saves will stay in memory unless you remember them explicitly.");
      return;
    }
    const current = currentSaveRef.current;
    if (current && document) {
      const summary = storedSummary(document, current.name);
      summary.byteLength = current.bytes.byteLength;
      setMessage(`Remembering ${current.name}…`);
      const result = await storeSave(current.bytes, summary);
      if (!result.ok) {
        setMessage(`Unable to remember save: ${result.error.message}`);
        return;
      }
      current.persistOnDecode = false;
    }
    setRemember(true);
    writeStoredBoolean(REMEMBER_SAVE_EXPLORER_KEY, true);
    setMessage(
      current ? `${current.name} is remembered.` : "Newly opened saves will be remembered.",
    );
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Save Explorer">
        Work in progress: preview the save parser and native-style minimap renderer. This is an
        early read-only explorer, so some game layers, colors, and bundled content are still being
        resolved. Files are processed locally and are stored only when you choose to remember them.
      </PageHeader>
      <SplitPane
        sidebarPosition="end"
        className="flex-col overflow-hidden rounded border border-slate-700 bg-black/75 shadow-xl xl:flex-row"
        contentClassName="min-h-0 min-w-0 flex-1 flex flex-col"
        sidebarClassName="w-full shrink-0 border-t border-l-0 border-slate-800/80 bg-slate-950/40 overflow-y-auto xl:w-80 xl:border-t-0 xl:border-l"
        sidebar={
          <SaveExplorerSidebar
            document={document}
            busy={busy}
            message={message}
            remember={remember}
            layers={layers}
            customCursor={customCursor}
            onLayerChange={updateLayer}
            onRemember={() => void toggleRemember()}
            onCustomCursorChange={setCustomCursor}
            onInspectBlueprint={(blueprintId) => {
              const saveId = encodeURIComponent(document?.metadata.saveId || "");
              const bpId = encodeURIComponent(blueprintId);
              window.location.assign(`${import.meta.env.BASE_URL}save/${saveId}/blueprint/${bpId}`);
            }}
            onCopyBlueprint={(blueprintId) => {
              const reqId = nextRequestIdRef.current++;
              latestEncodeIdRef.current = reqId;
              workerRef.current?.postMessage({ id: reqId, type: "encode", blueprintId });
              setMessage("Encoding blueprint string…");
            }}
          />
        }
      >
        <SaveExplorerMapPanel
          inputRef={inputRef}
          canvasRef={canvasRef}
          mapFrameRef={mapFrameRef}
          dragRef={dragRef}
          raster={raster}
          inspection={inspection}
          hoverCell={hoverCell}
          hoverCellRef={hoverCellRef}
          view={view}
          customCursor={customCursor}
          dragging={dragging}
          busy={busy}
          documentLoaded={Boolean(document)}
          message={message}
          onChooseFile={() => inputRef.current?.click()}
          onFile={decodeFile}
          onViewChange={handleViewChange}
          onHover={(cell) => {
            setHoverCell(cell);
            setInspection(null);
          }}
          onClearHover={() => {
            cancelQueuedInspect();
            setHoverCell(null);
            setInspection(null);
          }}
          onDraggingChange={setDragging}
          fitMap={fitMap}
          onInspect={queueInspect}
        />
      </SplitPane>
    </section>
  );
}
