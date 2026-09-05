import type { SaveBlueprintSummary, SaveExplorerDiagnostic } from "./model";

export type SaveBlueprintType = string | number;

export type SaveBlueprintStructure = {
  type: SaveBlueprintType;
  x: number;
  y: number;
  filter?: Record<string, unknown>;
  data?: unknown;
};

export type SaveBlueprintSignalLink = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  on: boolean;
};

export type SaveBlueprintRecord = {
  id: string;
  name: string;
  timestamp?: number;
  data: SaveBlueprintStructure[];
  signalLinks: SaveBlueprintSignalLink[] | null;
};

export type ExtractedSaveBlueprints = {
  blueprints: SaveBlueprintRecord[];
  summaries: SaveBlueprintSummary[];
  diagnostics: SaveExplorerDiagnostic[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validType(value: unknown): value is SaveBlueprintType {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
  );
}

function validEndpoint(value: unknown): value is { x: number; y: number } {
  return isRecord(value) && validCoordinate(value.x) && validCoordinate(value.y);
}

function diagnostic(path: string, message: string): SaveExplorerDiagnostic {
  return { severity: "warning", code: "invalid-blueprint", path, message };
}

function extractRecord(value: unknown, index: number, diagnostics: SaveExplorerDiagnostic[]) {
  const path = `store.mods.blueprints.saved[${index}]`;
  if (!isRecord(value)) {
    diagnostics.push(diagnostic(path, "Blueprint record must be an object"));
    return undefined;
  }
  if (typeof value.id !== "string" || value.id.trim().length === 0) {
    diagnostics.push(diagnostic(`${path}.id`, "Blueprint ID must be a non-empty string"));
    return undefined;
  }
  const name =
    typeof value.name === "string" && value.name.trim() ? value.name : `Blueprint ${value.id}`;
  if (
    value.timestamp !== undefined &&
    (typeof value.timestamp !== "number" || !Number.isFinite(value.timestamp))
  ) {
    diagnostics.push(diagnostic(`${path}.timestamp`, "Blueprint timestamp must be finite"));
    return undefined;
  }
  if (!Array.isArray(value.data)) {
    diagnostics.push(diagnostic(`${path}.data`, "Blueprint data must be an array"));
    return undefined;
  }
  const data: SaveBlueprintStructure[] = [];
  for (const [structureIndex, structureValue] of value.data.entries()) {
    const structurePath = `${path}.data[${structureIndex}]`;
    if (
      !isRecord(structureValue) ||
      !validType(structureValue.type) ||
      !validCoordinate(structureValue.x) ||
      !validCoordinate(structureValue.y)
    ) {
      diagnostics.push(
        diagnostic(structurePath, "Structure requires a valid type and non-negative coordinates"),
      );
      return undefined;
    }
    if (structureValue.filter !== undefined && !isRecord(structureValue.filter)) {
      diagnostics.push(diagnostic(`${structurePath}.filter`, "Structure filter must be an object"));
      return undefined;
    }
    data.push({
      type: structureValue.type,
      x: structureValue.x,
      y: structureValue.y,
      ...(structureValue.filter ? { filter: structureValue.filter } : {}),
      ...(Object.hasOwn(structureValue, "data") ? { data: structureValue.data } : {}),
    });
  }
  let signalLinks: SaveBlueprintSignalLink[] | null = null;
  if (value.signalLinks !== undefined && value.signalLinks !== null) {
    if (!Array.isArray(value.signalLinks)) {
      diagnostics.push(diagnostic(`${path}.signalLinks`, "Signal links must be null or an array"));
      return undefined;
    }
    signalLinks = [];
    for (const [linkIndex, linkValue] of value.signalLinks.entries()) {
      const linkPath = `${path}.signalLinks[${linkIndex}]`;
      if (
        !isRecord(linkValue) ||
        !validEndpoint(linkValue.from) ||
        !validEndpoint(linkValue.to) ||
        typeof linkValue.on !== "boolean"
      ) {
        diagnostics.push(
          diagnostic(linkPath, "Signal link requires valid endpoints and boolean state"),
        );
        return undefined;
      }
      signalLinks.push({ from: linkValue.from, to: linkValue.to, on: linkValue.on });
    }
  }
  return {
    id: value.id,
    name,
    ...(typeof value.timestamp === "number" ? { timestamp: value.timestamp } : {}),
    data,
    signalLinks,
  } satisfies SaveBlueprintRecord;
}

export function extractSavedBlueprints(payload: unknown): ExtractedSaveBlueprints {
  const diagnostics: SaveExplorerDiagnostic[] = [];
  const saved =
    isRecord(payload) &&
    isRecord(payload.store) &&
    isRecord(payload.store.mods) &&
    isRecord(payload.store.mods.blueprints)
      ? payload.store.mods.blueprints.saved
      : undefined;
  if (saved === undefined) return { blueprints: [], summaries: [], diagnostics };
  if (!Array.isArray(saved)) {
    diagnostics.push(
      diagnostic("store.mods.blueprints.saved", "Saved blueprints must be an array"),
    );
    return { blueprints: [], summaries: [], diagnostics };
  }
  const blueprints = saved.flatMap((value, index) => {
    const record = extractRecord(value, index, diagnostics);
    return record ? [record] : [];
  });
  return {
    blueprints,
    summaries: blueprints.map((blueprint) => ({
      id: blueprint.id,
      name: blueprint.name,
      structureCount: blueprint.data.length,
      ...(blueprint.timestamp !== undefined ? { createdAt: blueprint.timestamp } : {}),
    })),
    diagnostics,
  };
}
