import { useEffect, useMemo, useRef, useState } from "react";
import { decodeBlueprint, prepareSvgForPng, renderBlueprintToSvg } from "@sandustry/blueprint-core";
import { blueprintCatalog } from "../utils/catalog";
import { createBrowserPngPlatform, createImageResolver } from "../utils/png-platform";
import {
  isAllowedParentOrigin,
  isRendererRequest,
  parentOrigin,
  rendererPreviewErrorEvent,
  rendererPreviewReadyEvent,
  rendererReadyEvent,
  type BlueprintRendererMode,
} from "../embed/protocol";

const MAX_PREVIEW_BLUEPRINT_LENGTH = 200_000;
const THUMBNAIL_MAX_WIDTH = 640;
const THUMBNAIL_MAX_HEIGHT = 360;

export function BlueprintEmbedPage() {
  const mode = useMemo<BlueprintRendererMode | null>(() => {
    const value = new URLSearchParams(window.location.search).get("mode");
    return value === "thumbnail" || value === "inspector" ? value : null;
  }, []);
  const [status, setStatus] = useState(mode ? "Waiting for a blueprint." : "Invalid embed mode.");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const renderToken = useRef(0);
  const renderTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!mode || window.parent === window) return;
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin) {
      setStatus("Embed origin is not configured.");
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isAllowedParentOrigin(event.origin)) return;
      if (!isRendererRequest(event.data) || mode !== "thumbnail") return;
      const token = ++renderToken.current;
      if (renderTimer.current !== null) window.clearTimeout(renderTimer.current);
      renderTimer.current = window.setTimeout(() => {
        renderTimer.current = null;
        void renderThumbnail(event.data.requestId, event.data.blueprint, token).then((result) => {
          if (!result || token !== renderToken.current) return;
          setPreviewSize({ width: result.width, height: result.height });
          setPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return result.url;
          });
          setStatus(`Preview ready: ${result.blueprintName}.`);
          window.parent.postMessage(
            rendererPreviewReadyEvent(
              event.data.requestId,
              result.blueprintName,
              result.width,
              result.height,
            ),
            event.origin,
          );
        });
      }, 100);
    };
    window.addEventListener("message", handleMessage);
    window.parent.postMessage(rendererReadyEvent([mode]), allowedOrigin);
    return () => {
      renderToken.current += 1;
      if (renderTimer.current !== null) window.clearTimeout(renderTimer.current);
      window.removeEventListener("message", handleMessage);
    };
  }, [mode]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function renderThumbnail(requestId: string, blueprintString: string, token: number) {
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin || token !== renderToken.current) return null;
    if (blueprintString.length > MAX_PREVIEW_BLUEPRINT_LENGTH) {
      window.parent.postMessage(
        rendererPreviewErrorEvent(requestId, "too-large", "Blueprint string is too large."),
        allowedOrigin,
      );
      setStatus("Blueprint string is too large.");
      return null;
    }
    let blueprint;
    try {
      blueprint = decodeBlueprint(blueprintString);
    } catch (error) {
      window.parent.postMessage(
        rendererPreviewErrorEvent(
          requestId,
          blueprintString.startsWith("SAND:BP:v1:") || blueprintString.startsWith("SAND:BACKUP:v1:")
            ? "unsupported-format"
            : "invalid-blueprint",
          error instanceof Error ? error.message : "Unable to decode blueprint.",
        ),
        allowedOrigin,
      );
      setStatus("Unable to decode blueprint.");
      return null;
    }
    setStatus("Rendering preview…");
    try {
      const assetBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href;
      const rendered = renderBlueprintToSvg(blueprint, {
        catalog: blueprintCatalog(),
        padding: 6,
        cell: 8,
        assetBaseUrl,
        includeBackground: true,
        showGrid: false,
        showFoundationOutlines: false,
        showSignalLinks: false,
      });
      const scale = Math.min(
        1,
        THUMBNAIL_MAX_WIDTH / rendered.model.width,
        THUMBNAIL_MAX_HEIGHT / rendered.model.height,
      );
      const prepared = await prepareSvgForPng(rendered.svg, {
        width: rendered.model.width,
        height: rendered.model.height,
        scale,
        title: blueprint.name,
        includeBackground: true,
        resolveImage: createImageResolver(assetBaseUrl),
      });
      const image = await createBrowserPngPlatform().loadSvg(prepared);
      const bitmap = await createImageBitmap(image);
      const worker = new Worker(new URL("../blueprint-worker.ts", import.meta.url), {
        type: "module",
      });
      const png = await new Promise<ArrayBuffer>((resolve, reject) => {
        worker.onmessage = (
          event: MessageEvent<{ type: string; png?: ArrayBuffer; message?: string }>,
        ) => {
          if (event.data.type === "result" && event.data.png) resolve(event.data.png);
          else if (event.data.type === "error") reject(new Error(event.data.message));
        };
        worker.onerror = () => reject(new Error("Preview worker stopped unexpectedly."));
        worker.postMessage(
          {
            type: "encode",
            image: bitmap,
            width: Math.max(1, Math.round(rendered.model.width * scale)),
            height: Math.max(1, Math.round(rendered.model.height * scale)),
          },
          [bitmap],
        );
      }).finally(() => worker.terminate());
      if (token !== renderToken.current) return null;
      return {
        url: URL.createObjectURL(new Blob([png], { type: "image/png" })),
        width: Math.max(1, Math.round(rendered.model.width * scale)),
        height: Math.max(1, Math.round(rendered.model.height * scale)),
        blueprintName: blueprint.name,
      };
    } catch (error) {
      if (token === renderToken.current) setStatus("Unable to render preview.");
      window.parent.postMessage(
        rendererPreviewErrorEvent(
          requestId,
          "render-failed",
          error instanceof Error ? error.message : "Unable to render preview.",
        ),
        allowedOrigin,
      );
      return null;
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-sd-950 p-4 text-slate-100"
      data-embed-mode={mode ?? "invalid"}
    >
      <section className="w-full max-w-2xl rounded border border-slate-800 bg-slate-950/70 p-3 shadow-xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
          Blueprint renderer
        </p>
        {previewUrl ? (
          <img
            className="mt-3 h-auto w-full rounded border border-slate-800 bg-[#33a8ff]"
            src={previewUrl}
            width={previewSize?.width}
            height={previewSize?.height}
            alt="Blueprint thumbnail preview"
          />
        ) : null}
        <p className="mt-3 text-sm text-slate-300" role="status">
          {status}
        </p>
      </section>
    </main>
  );
}
