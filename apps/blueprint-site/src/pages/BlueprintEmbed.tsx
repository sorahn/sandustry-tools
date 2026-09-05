import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeBlueprint } from "@daryl.roberts/sandustry-blueprint-core";
import { BlueprintMap } from "../components/BlueprintMap";
import { readStorageValue } from "../utils/storage";
import { REMEMBER_BLUEPRINT_KEY, SAVED_BLUEPRINT_KEY } from "../utils/storage-keys";
import {
  isAllowedParentOrigin,
  isRendererInspectorOptionsRequest,
  isRendererRequest,
  parentOrigin,
  rendererPreviewErrorEvent,
  rendererExportPngEvent,
  rendererResizeEvent,
  rendererReadyEvent,
} from "../embed/protocol";
import { resolveFitPolicy, type FitPolicy, type FitPolicySelection } from "../utils/blueprint-fit";

const MAX_PREVIEW_BLUEPRINT_LENGTH = 200_000;

export function BlueprintEmbedPage() {
  return <BlueprintInspectorEmbed />;
}

function BlueprintInspectorEmbed() {
  const mapRootRef = useRef<HTMLDivElement>(null);
  const lastReportedSizeRef = useRef<{ width: number; height: number } | null>(null);
  const loadRemembered = useMemo(
    () => new URLSearchParams(window.location.search).get("remember") === "1",
    [],
  );
  const [blueprint, setBlueprint] = useState<ReturnType<typeof decodeBlueprint> | null>(null);
  const [blueprintKey, setBlueprintKey] = useState("");
  const [status, setStatus] = useState("Waiting for a blueprint.");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showPngBackground, setShowPngBackground] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fitPolicy, setFitPolicy] = useState<FitPolicy | undefined>();
  const exportPng = useCallback((png: ArrayBuffer, filename: string) => {
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin || window.parent === window) return;
    window.parent.postMessage(rendererExportPngEvent(filename, png), allowedOrigin, [png]);
  }, []);

  useEffect(() => {
    // The parent iframe owns sizing. Prevent the browser's fallback scrollbar
    // from changing the measured width while the parent catches up with the
    // renderer's reported height.
    const documentElement = document.documentElement;
    const body = document.body;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      documentElement.style.overflow = previousDocumentOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (window.parent === window || typeof ResizeObserver === "undefined") return;
    const allowedOrigin = parentOrigin();
    const element = mapRootRef.current;
    if (!allowedOrigin || !element) return;
    const sendSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const size = { width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
      const previous = lastReportedSizeRef.current;
      if (previous?.width === size.width && previous.height === size.height) return;
      lastReportedSizeRef.current = size;
      window.parent.postMessage(rendererResizeEvent(size.width, size.height), allowedOrigin);
    };
    const observer = new ResizeObserver(sendSize);
    observer.observe(element);
    sendSize();
    return () => observer.disconnect();
  }, [blueprint, showGrid, showPngBackground, showSidebar, showFilters]);

  useEffect(() => {
    let rememberedLoaded = false;
    if (loadRemembered && readStorageValue(REMEMBER_BLUEPRINT_KEY) === "true") {
      const encoded = readStorageValue(SAVED_BLUEPRINT_KEY);
      if (encoded) {
        try {
          const decoded = decodeBlueprint(encoded);
          setBlueprint(decoded);
          setBlueprintKey(encoded);
          setStatus(`Remembered ${decoded.data.length} structure(s) from ${decoded.name}.`);
          rememberedLoaded = true;
        } catch {
          setStatus("Unable to decode the remembered blueprint.");
        }
      }
    }
    if (window.parent === window) return;
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin) {
      if (!rememberedLoaded) setStatus("Embed origin is not configured.");
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isAllowedParentOrigin(event.origin)) return;
      if (isRendererInspectorOptionsRequest(event.data)) {
        if (event.data.showGrid !== undefined) setShowGrid(event.data.showGrid);
        if (event.data.showPngBackground !== undefined) {
          setShowPngBackground(event.data.showPngBackground);
        }
        if (event.data.showSidebar !== undefined) setShowSidebar(event.data.showSidebar);
        if (event.data.showFilters !== undefined) setShowFilters(event.data.showFilters);
        return;
      }
      if (!isRendererRequest(event.data)) return;
      const { requestId, blueprint: encoded } = event.data;
      setFitPolicy(
        event.data.fitPolicy === undefined
          ? undefined
          : resolveFitPolicy(event.data.fitPolicy as FitPolicySelection),
      );
      const isLegacyV1 = encoded.startsWith("SAND:BP:v1:") || encoded.startsWith("SAND:BACKUP:v1:");
      if (isLegacyV1) {
        setBlueprint(null);
        setStatus("Legacy v1 strings are not supported by the blueprint inspector.");
        window.parent.postMessage(
          rendererPreviewErrorEvent(
            requestId,
            "unsupported-format",
            "Legacy v1 strings are not supported by the blueprint inspector.",
          ),
          event.origin,
        );
        return;
      }
      if (encoded.length > MAX_PREVIEW_BLUEPRINT_LENGTH) {
        setBlueprint(null);
        setStatus("Blueprint string is too large.");
        window.parent.postMessage(
          rendererPreviewErrorEvent(requestId, "too-large", "Blueprint string is too large."),
          event.origin,
        );
        return;
      }
      try {
        const decoded = decodeBlueprint(encoded);
        setBlueprint(decoded);
        setBlueprintKey(encoded);
        setStatus(`Inspected ${decoded.data.length} structure(s) from ${decoded.name}.`);
      } catch (error) {
        setBlueprint(null);
        setStatus("Unable to decode blueprint.");
        window.parent.postMessage(
          rendererPreviewErrorEvent(
            requestId,
            "invalid-blueprint",
            error instanceof Error ? error.message : "Unable to decode blueprint.",
          ),
          event.origin,
        );
      }
    };
    window.addEventListener("message", handleMessage);
    window.parent.postMessage(rendererReadyEvent(), allowedOrigin);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadRemembered]);

  return (
    <div ref={mapRootRef} data-embed-mode="inspector">
      {blueprint ? (
        <BlueprintMap
          blueprint={blueprint}
          remember={loadRemembered}
          blueprintKey={blueprintKey}
          showSidebar={showSidebar}
          showGrid={showGrid}
          showPngBackground={showPngBackground}
          showFilters={showFilters}
          showDebugOptions={false}
          fitPolicy={fitPolicy}
          stickyTop="0px"
          embedMode
          onExportPng={exportPng}
        />
      ) : (
        <p role="status">{status}</p>
      )}
    </div>
  );
}
