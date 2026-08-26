import { useEffect, useMemo, useState } from "react";
import {
  isAllowedParentOrigin,
  parentOrigin,
  rendererReadyEvent,
  type BlueprintRendererMode,
} from "../embed/protocol";

export function BlueprintEmbedPage() {
  const mode = useMemo<BlueprintRendererMode | null>(() => {
    const value = new URLSearchParams(window.location.search).get("mode");
    return value === "thumbnail" || value === "inspector" ? value : null;
  }, []);
  const [status, setStatus] = useState(mode ? "Waiting for a blueprint." : "Invalid embed mode.");

  useEffect(() => {
    if (!mode || window.parent === window) return;
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin) {
      setStatus("Embed origin is not configured.");
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isAllowedParentOrigin(event.origin)) return;
      setStatus("Renderer is ready.");
    };
    window.addEventListener("message", handleMessage);
    window.parent.postMessage(rendererReadyEvent([mode]), allowedOrigin);
    return () => window.removeEventListener("message", handleMessage);
  }, [mode]);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-sd-950 p-4 text-slate-100"
      data-embed-mode={mode ?? "invalid"}
    >
      <section className="w-full max-w-2xl rounded border border-slate-800 bg-slate-950/70 p-6 shadow-xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
          Blueprint renderer
        </p>
        <p className="mt-3 text-sm text-slate-300" role="status">
          {status}
        </p>
      </section>
    </main>
  );
}
