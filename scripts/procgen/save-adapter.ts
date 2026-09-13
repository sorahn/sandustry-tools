import type {
  SaveGameDocument,
  SaveGameMetadata,
  SaveGamePayload,
} from "../../packages/sandustry-save-core/src/index.ts";
import type { CapturedTerrainPayload } from "./terrain.ts";

export type SyntheticSaveOptions = {
  worldName?: string;
  structures?: unknown[];
};

/**
 * Creates the minimal valid SaveGameDocument from captured procgen terrain.
 * Compatible with @sandustry/save-core renderers and analyzers.
 */
export function createSyntheticSaveDocument(
  captured: CapturedTerrainPayload,
  options?: SyntheticSaveOptions,
): SaveGameDocument {
  const { width, height, seed, version, matrix } = captured;

  if (matrix.length % 2 !== 0) {
    throw new Error(`Invalid RLE matrix: length ${matrix.length} is not even`);
  }

  const expectedLength = width * height;
  let totalCells = 0;
  for (let i = 1; i < matrix.length; i += 2) {
    const count = matrix[i];
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`Invalid RLE count at pair ${i / 2}: ${count}`);
    }
    totalCells += count;
  }

  if (totalCells !== expectedLength) {
    throw new Error(
      `Matrix cell count (${totalCells}) does not match expected world dimensions (${width}x${height} = ${expectedLength})`,
    );
  }

  const sanitizedSeed = seed.replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown";
  const saveId = `procgen-${sanitizedSeed}`;
  const worldName = options?.worldName ?? `Procgen ${seed}`;

  const metadata: SaveGameMetadata = {
    id: saveId,
    name: worldName,
    seed,
    worldName,
    timestamp: new Date().toISOString(),
    playTime: 0,
    structureCount: options?.structures?.length ?? 0,
  };

  const payload: SaveGamePayload = {
    store: {
      world: {
        size: { width, height },
      },
      meta: {
        seed,
        worldName,
        time: 0,
        tick: 0,
      },
      version: version || "0.5.6",
      structures: options?.structures ?? [],
    },
    matrix,
  };

  return {
    metadata,
    payload,
    compressedPayloadBytes: 0,
    decompressedPayloadBytes: 0,
  };
}
