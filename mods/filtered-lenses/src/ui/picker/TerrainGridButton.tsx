import type { TerrainEntry } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

export const TerrainGridButton = ({
  entry,
  index,
  filtered,
  isSelected,
  isMultiSelected,
  onSelectSingle,
  onToggle,
  pickerId,
  scope,
}: {
  entry: TerrainEntry;
  index: number;
  filtered: TerrainEntry[];
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelectSingle: () => void;
  onToggle: () => void;
  pickerId: string;
  scope: string;
}) => {
  if (!UIReact) return null;
  const key = (value: TerrainEntry) => `${pickerId}-terrain-${value.id || `type-${value.type}`}`;
  const column = index % 4;
  const focusable = api.ui.navigation.useFocusable({
    id: key(entry),
    scope,
    onActivate: onSelectSingle,
    scrollIntoView: true,
    neighbors: {
      left: column > 0 ? key(filtered[index - 1]) : undefined,
      right: column < 3 && filtered[index + 1] ? key(filtered[index + 1]) : undefined,
      up: index >= 4 ? key(filtered[index - 4]) : `${pickerId}-no-filter`,
      down: filtered[index + 4] ? key(filtered[index + 4]) : undefined,
    },
  });

  const select = () => {
    focusable.focus();
    onSelectSingle();
  };

  const focusClass = api.ui.navigation.controllerFocusClass(focusable.focused);
  const containerClass = isSelected
    ? "border-[#ffe700] bg-[#ffe700]/10"
    : "border-slate-700 hover:border-slate-500 bg-black/40 hover:bg-black/60";

  return (
    <div
      className={`group flex items-center rounded border transition-all duration-200 ${containerClass} ${focusClass}`.trim()}
    >
      <button
        type="button"
        className={`ml-2 flex h-3 w-3 flex-shrink-0 items-center justify-center border text-[9px] ${
          isMultiSelected
            ? "border-[#ffe700] text-[#ffe700]"
            : "border-slate-600 text-transparent hover:border-slate-400"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onMouseDown={(e) => e.preventDefault()}
        tabIndex={-1}
      >
        ✓
      </button>
      <button
        ref={focusable.ref}
        type="button"
        onClick={select}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
      >
        <div className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span
          className={`text-xs truncate transition-colors ${
            isSelected ? "text-[#ffe700]" : "text-slate-300 group-hover:text-white"
          }`}
        >
          {entry.name}
        </span>
        {isSelected && !isMultiSelected && (
          <span className="ml-auto text-[#ffe700] text-[10px]">✓</span>
        )}
      </button>
    </div>
  );
};
