import type { TerrainEntry, TerrainSelection } from "./ui/picker/pickerTypes";

export const NO_FILTER_ID = "no-filter";
const LEGACY_EARTH_FILTER_ID = "filter:earth";
const LEGACY_EARTH_TERRAIN_IDS = ["dirt", "grass", "moss", "vine", "earth"];

export const LEGACY_TERRAIN_ID_ALIASES: Record<string, string> = {
  frostbed: "freezingIceSoil",
  scoria: "obsidian",
  redsoil: "sandiumSoil",
  sporemound: "sporeSoil",
};

export const NO_FILTER_ENTRY: TerrainEntry = {
  id: NO_FILTER_ID,
  type: -1,
  name: "[No filter]",
  color: "#9aa7b5",
};

export const NO_FILTER_SELECTION: TerrainSelection = {
  ids: [NO_FILTER_ID],
  types: [],
  entries: [NO_FILTER_ENTRY],
};

export const isNoFilter = (selection: TerrainSelection | null | undefined): boolean => {
  if (!selection) return true;
  return (
    selection.ids.length === 0 ||
    selection.ids.includes(NO_FILTER_ID) ||
    selection.entries.length === 0
  );
};

export const serializeSelection = (selection: TerrainSelection): string => {
  if (isNoFilter(selection)) return `terrain:${NO_FILTER_ID}`;
  return `terrain:${selection.ids.join(",")}`;
};

export const deserializeSelection = (
  saved: string | null | undefined,
  availableEntries: TerrainEntry[],
): TerrainSelection => {
  if (typeof saved !== "string" || saved.length === 0) return NO_FILTER_SELECTION;
  const raw = saved.startsWith("terrain:") ? saved.slice(8) : saved;
  if (!raw || raw === NO_FILTER_ID) return NO_FILTER_SELECTION;

  let tokens = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.includes(LEGACY_EARTH_FILTER_ID)) {
    tokens = tokens.filter((t) => t !== LEGACY_EARTH_FILTER_ID).concat(LEGACY_EARTH_TERRAIN_IDS);
  }

  const matchedEntries: TerrainEntry[] = [];
  const seenIds = new Set<string>();

  for (const token of tokens) {
    const resolvedId = LEGACY_TERRAIN_ID_ALIASES[token] || token;
    const entry = availableEntries.find(
      (e) => e.id === resolvedId || e.id.toLowerCase() === resolvedId.toLowerCase(),
    );
    if (entry && !seenIds.has(entry.id)) {
      seenIds.add(entry.id);
      matchedEntries.push(entry);
    }
  }

  if (matchedEntries.length === 0) return NO_FILTER_SELECTION;

  return {
    ids: matchedEntries.map((e) => e.id),
    types: matchedEntries.map((e) => e.type),
    entries: matchedEntries,
  };
};
