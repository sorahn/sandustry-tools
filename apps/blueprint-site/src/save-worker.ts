/// <reference lib="webworker" />

import {
  decodeBrowserSave,
  normalizeSaveDocument,
  prepareSaveExplorerRenderState,
  composeSaveExplorerMinimap,
  inspectPreparedSaveExplorerCell,
  toSaveExplorerClientDocument,
  type MinimapRenderOptions,
  type NormalizeSaveOptions,
  type SaveExplorerCellInspection,
  type SaveExplorerDocument,
  type SaveExplorerClientDocument,
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
      type: "decoded";
      document: SaveExplorerClientDocument;
      raster: { width: number; height: number; pixels: ArrayBuffer };
    }
  | {
      id?: number;
      type: "rendered";
      raster: { width: number; height: number; pixels: ArrayBuffer };
    }
  | { id?: number; type: "inspection"; inspection?: SaveExplorerCellInspection }
  | {
      id?: number;
      type: "error";
      operation: "decode" | "render" | "inspect";
      message: string;
    };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SaveWorkerRequest>) => void) | null;
  postMessage: (message: SaveWorkerResponse, transfer?: Transferable[]) => void;
};

let latestDecodeId = 0;
let decodedSave: Awaited<ReturnType<typeof decodeBrowserSave>> | null = null;
let decodedDocument: SaveExplorerDocument | null = null;
let preparedRenderState: ReturnType<typeof prepareSaveExplorerRenderState> | null = null;

workerScope.onmessage = async ({ data }) => {
  try {
    if (data.type === "decode") {
      const requestId = data.id ?? 0;
      latestDecodeId = Math.max(latestDecodeId, requestId);
      const save = await decodeBrowserSave(data.bytes);
      const doc = normalizeSaveDocument(save, data.options);
      // Discard stale decode if a newer decode was received while awaiting
      if (requestId < latestDecodeId) {
        return;
      }
      decodedSave = save;
      decodedDocument = doc;
      preparedRenderState = prepareSaveExplorerRenderState(decodedSave, data.render);
      const raster = composeSaveExplorerMinimap(preparedRenderState, data.render);
      workerScope.postMessage(
        {
          id: data.id,
          type: "decoded",
          document: toSaveExplorerClientDocument(decodedDocument),
          raster: {
            width: raster.width,
            height: raster.height,
            pixels: raster.pixels.buffer as ArrayBuffer,
          },
        },
        [raster.pixels.buffer],
      );
      return;
    }
    if (!decodedSave || !decodedDocument || !preparedRenderState)
      throw new Error("No save is loaded");
    if (data.type === "inspect") {
      workerScope.postMessage({
        id: data.id,
        type: "inspection",
        inspection: inspectPreparedSaveExplorerCell(preparedRenderState, data.mapX, data.mapY),
      });
      return;
    }
    const raster = composeSaveExplorerMinimap(preparedRenderState, data.render);
    workerScope.postMessage(
      {
        id: data.id,
        type: "rendered",
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
      operation: data.type,
      message: error instanceof Error ? error.message : "Unable to decode save",
    });
  }
};
