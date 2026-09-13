import type { StructureEntry, StructureSelection } from "./ui/picker/pickerTypes";

export const NO_FILTER_ID = "no-filter";

export const NO_FILTER_ENTRY: StructureEntry = {
  id: NO_FILTER_ID,
  type: -1,
  types: [],
  ids: [NO_FILTER_ID],
  name: "[No filter]",
  color: "#9aa7b5",
};

export const NO_FILTER_SELECTION: StructureSelection = {
  ids: [NO_FILTER_ID],
  types: [],
  entries: [NO_FILTER_ENTRY],
};

export const isNoFilter = (selection: StructureSelection | null | undefined): boolean => {
  if (!selection) return true;
  return (
    selection.ids.length === 0 ||
    selection.ids.includes(NO_FILTER_ID) ||
    selection.entries.length === 0
  );
};

export const serializeSelection = (selection: StructureSelection): string => {
  if (isNoFilter(selection)) return `structures:${NO_FILTER_ID}`;
  return `structures:${selection.ids.join(",")}`;
};

export const deserializeSelection = (
  saved: string | null | undefined,
  availableEntries: StructureEntry[],
): StructureSelection => {
  if (typeof saved !== "string" || saved.length === 0) return NO_FILTER_SELECTION;
  const raw = saved.startsWith("structures:") ? saved.slice(11) : saved;
  if (!raw || raw === NO_FILTER_ID) return NO_FILTER_SELECTION;

  const tokens = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const matchedEntries: StructureEntry[] = [];
  const seenIds = new Set<string>();

  for (const token of tokens) {
    const entry = availableEntries.find(
      (e) =>
        e.id === token ||
        e.id.toLowerCase() === token.toLowerCase() ||
        Boolean(e.ids?.includes(token)),
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

export const CATEGORY_ORDER: string[] = [
  "logistics",
  "production",
  "blocks",
  "economy",
  "lighting",
  "fluids",
  "special",
  "thermal",
  "energy",
  "logic",
  "misc",
];

export const CATEGORY_TITLES: Record<string, string> = {
  logistics: "Logistics",
  production: "Production",
  blocks: "Blocks",
  economy: "Economy",
  lighting: "Lighting",
  fluids: "Fluids",
  special: "Special",
  thermal: "Thermal",
  energy: "Energy",
  logic: "Logic",
  misc: "Misc",
  testblocks: "Test Blocks",
};

export const normalizeCategoryKey = (categoryKey?: string, category?: string): string => {
  const raw = categoryKey || category || "misc";
  const str = String(raw).trim().toLowerCase();
  if (str.startsWith("ui|management|category|")) {
    return str.slice(23);
  }
  return str;
};

export const getCategoryTitle = (categoryKey?: string): string => {
  const norm = normalizeCategoryKey(categoryKey);
  return CATEGORY_TITLES[norm] || norm.charAt(0).toUpperCase() + norm.slice(1);
};

export const CATEGORY_COLORS: Record<string, string> = {
  logistics: "#38bdf8",
  production: "#f59e0b",
  energy: "#eab308",
  power: "#eab308",
  processing: "#ec4899",
  defense: "#ef4444",
  utility: "#a855f7",
  testBlocks: "#10b981",
  blocks: "#60a5fa",
  general: "#94a3b8",
};

export const getCategoryColor = (categoryKey?: string): string => {
  if (!categoryKey) return CATEGORY_COLORS.general;
  const lower = categoryKey.toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lower.includes(key.toLowerCase())) return CATEGORY_COLORS[key];
  }
  return CATEGORY_COLORS.general;
};
