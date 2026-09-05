/// <reference lib="webworker" />

import { decodeBrowserSave, extractSavedBlueprints } from "@sandustry/save-core";

export type SaveBlueprintWorkerRequest = { bytes: ArrayBuffer };

export type SaveBlueprintWorkerResponse =
  | { type: "result"; extracted: ReturnType<typeof extractSavedBlueprints> }
  | { type: "error"; message: string };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SaveBlueprintWorkerRequest>) => void) | null;
  postMessage: (message: SaveBlueprintWorkerResponse) => void;
};

workerScope.onmessage = async ({ data }) => {
  try {
    const save = await decodeBrowserSave(data.bytes);
    workerScope.postMessage({ type: "result", extracted: extractSavedBlueprints(save.payload) });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Unable to decode save",
    });
  }
};
