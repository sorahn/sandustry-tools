/// <reference lib="webworker" />

import { renderBlueprintStringToPng } from "@sandustry/blueprint-core";
import { blueprintCatalog } from "./utils/catalog";
import { createImageResolver, createWorkerPngPlatform } from "./utils/png-platform";

type WorkerRequest = {
  type: "render";
  blueprint: string;
  assetBaseUrl: string;
  scale?: number;
  includeBackground?: boolean;
  showGrid?: boolean;
  showFoundationOutlines?: boolean;
  showSignalLinks?: boolean;
};

type WorkerResponse = { type: "result"; png: ArrayBuffer } | { type: "error"; message: string };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

const platform = createWorkerPngPlatform();

workerScope.onmessage = async ({ data }) => {
  if (data.type !== "render") return;
  try {
    const png = await renderBlueprintStringToPng(data.blueprint, {
      catalog: blueprintCatalog(),
      assetBaseUrl: data.assetBaseUrl,
      scale: data.scale ?? 1,
      platform,
      includeBackground: data.includeBackground ?? true,
      showGrid: data.showGrid ?? true,
      showFoundationOutlines: data.showFoundationOutlines ?? true,
      showSignalLinks: data.showSignalLinks ?? true,
      resolveImage: createImageResolver(data.assetBaseUrl),
    });
    const buffer = png.buffer as ArrayBuffer;
    workerScope.postMessage({ type: "result", png: buffer }, [buffer]);
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Unable to render blueprint PNG",
    });
  }
};
