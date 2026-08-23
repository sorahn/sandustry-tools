import type { TerrainEntry } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

export const TerrainGridButton = ({
  entry,
  index,
  filtered,
  selected,
  onSelect,
  pickerId,
  scope,
}: {
  entry: TerrainEntry;
  index: number;
  filtered: TerrainEntry[];
  selected: boolean;
  onSelect: () => void;
  pickerId: string;
  scope: string;
}) => {
  if (!UIReact) return null;
  const key = (value: TerrainEntry) => `${pickerId}-terrain-${value.id || `type-${value.type}`}`;
  const column = index % 4;
  const focusable = api.ui.navigation.useFocusable({
    id: key(entry),
    scope,
    onActivate: onSelect,
    scrollIntoView: true,
    neighbors: {
      left: column > 0 ? key(filtered[index - 1]) : undefined,
      right: column < 3 && filtered[index + 1] ? key(filtered[index + 1]) : undefined,
      up: index >= 4 ? key(filtered[index - 4]) : `${pickerId}-custom-earth`,
      down: filtered[index + 4] ? key(filtered[index + 4]) : undefined,
    },
  });
  const className = selected
    ? "group flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border border-[#ffe700] bg-[#ffe700]/10"
    : "group flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border border-slate-700 hover:border-slate-500 bg-black/40 hover:bg-black/60";
  const select = () => {
    focusable.focus();
    onSelect();
  };
  return (
    <button
      ref={focusable.ref}
      type="button"
      onClick={select}
      className={`${className} ${api.ui.navigation.controllerFocusClass(focusable.focused)}`.trim()}
    >
      <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: entry.color }} />
      <span
        className={selected ? "text-xs truncate text-[#ffe700]" : "text-xs truncate text-slate-300"}
      >
        {entry.name}
      </span>
    </button>
  );
};
