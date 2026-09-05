/// <reference lib="webworker" />

import {
  decodeBrowserSave,
  decodeBrowserSaveDocument,
  inspectSaveExplorerCell,
  renderMinimapRgba,
  type MinimapRenderOptions,
  type NormalizeSaveOptions,
  type SaveExplorerCellInspection,
  type SaveExplorerDocument,
} from "@sandustry/save-core";

export type SaveWorkerRequest =
  | {
      id?: number;
      type: "decode";
      bytes: ArrayBuffer;
      options?: NormalizeSaveOptions;
      render?: MinimapRenderOptions;
    }
  | { id?: number; type: "render"; render?: MinimapRenderOptions }
  | { id?: number; type: "inspect"; mapX: number; mapY: number };

export type SaveWorkerResponse =
  | {
      id?: number;
      type: "result";
      document: SaveExplorerDocument;
      raster: { width: number; height: number; pixels: ArrayBuffer };
    }
  | { id?: number; type: "inspection"; inspection?: SaveExplorerCellInspection }
  | { id?: number; type: "error"; message: string };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SaveWorkerRequest>) => void) | null;
  postMessage: (message: SaveWorkerResponse, transfer?: Transferable[]) => void;
};

let latestDecodeId = 0;
let decodedSave: Awaited<ReturnType<typeof decodeBrowserSave>> | null = null;
let decodedDocument: SaveExplorerDocument | null = null;

workerScope.onmessage = async ({ data }) => {
  try {
    if (data.type === "decode") {
      const requestId = data.id ?? 0;
      latestDecodeId = Math.max(latestDecodeId, requestId);
      const save = await decodeBrowserSave(data.bytes);
      const doc = await decodeBrowserSaveDocument(data.bytes, data.options);
      // Discard stale decode if a newer decode was received while awaiting
      if (requestId < latestDecodeId) {
        return;
      }
      decodedSave = save;
      decodedDocument = doc;
    }
    if (!decodedSave || !decodedDocument) throw new Error("No save is loaded");
    if (data.type === "inspect") {
      workerScope.postMessage({
        id: data.id,
        type: "inspection",
        inspection: inspectSaveExplorerCell(decodedSave, data.mapX, data.mapY),
      });
      return;
    }
    const raster = renderMinimapRgba(decodedSave, data.render);
    workerScope.postMessage(
      {
        id: data.id,
        type: "result",
        document: decodedDocument,
        raster: {
          width: raster.width,
          height: raster.height,
          pixels: raster.pixels.buffer as ArrayBuffer,
        },
      },
      [raster.pixels.buffer],
    );
  } catch (error) {
    workerScope.postMessage({
      id: data.id,
      type: "error",
      message: error instanceof Error ? error.message : "Unable to decode save",
    });
  }
};
