import type { ExtractedSaveBlueprints } from "@sandustry/save-core";
import type {
  SaveBlueprintWorkerRequest,
  SaveBlueprintWorkerResponse,
} from "../save-blueprint-worker";

/** Decode a save and extract its blueprints without decompressing or parsing on the UI thread. */
export function extractSaveBlueprintsInWorker(
  input: ArrayBuffer | Uint8Array,
): Promise<ExtractedSaveBlueprints> {
  const bytes = input instanceof Uint8Array ? input.slice().buffer : input.slice(0);
  const worker = new Worker(new URL("../save-blueprint-worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    const cleanup = () => worker.terminate();
    worker.onmessage = (event: MessageEvent<SaveBlueprintWorkerResponse>) => {
      cleanup();
      if (event.data.type === "result") resolve(event.data.extracted);
      else reject(new Error(event.data.message));
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error("The save blueprint worker stopped unexpectedly"));
    };
    const request: SaveBlueprintWorkerRequest = { bytes };
    worker.postMessage(request, [bytes]);
  });
}
