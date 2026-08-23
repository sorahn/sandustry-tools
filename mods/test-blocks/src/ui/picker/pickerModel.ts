import type { PickerElement, PickerSelection } from "./pickerTypes";
import { matterName } from "./elementCatalog";

export type PickerQueryState = {
  query: string;
  matter: string;
};

export const filterElements = (entries: PickerElement[], state: PickerQueryState) => {
  const normalizedQuery = state.query.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesQuery =
      !normalizedQuery ||
      entry.name.toLowerCase().includes(normalizedQuery) ||
      (entry.id || "").toLowerCase().includes(normalizedQuery);
    return (
      matchesQuery && (state.matter === "All" || matterName(entry.matterType) === state.matter)
    );
  });
};

export const matterTabs = (entries: PickerElement[]) => [
  "All",
  ...new Set(entries.map((entry) => matterName(entry.matterType))),
];

export const isSelectedElement = (entry: PickerElement, selection: PickerSelection) =>
  selection.type !== null
    ? entry.type === selection.type
    : entry.id !== null && entry.id === selection.id;

export const findSelectedElement = (
  entries: PickerElement[],
  selection: PickerSelection,
  fallbackName: string,
): PickerElement =>
  entries.find((entry) => entry.id !== null && entry.id === selection.id) ||
  entries.find((entry) => entry.type === selection.type) || {
    id: selection.id,
    type: selection.type ?? 0,
    name: selection.id || fallbackName,
    color: "#9aa7b5",
  };
