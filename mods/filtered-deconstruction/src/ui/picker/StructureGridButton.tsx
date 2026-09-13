import type { StructureEntry } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

export const StructureGridButton = ({
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
  entry: StructureEntry;
  index: number;
  filtered: StructureEntry[];
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelectSingle: () => void;
  onToggle: () => void;
  pickerId: string;
  scope: string;
}) => {
  if (!UIReact) return null;
  const key = (value: StructureEntry) => `${pickerId}-struct-${value.id}`;
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
    ? "border-[#ffe700] bg-[#ffe700] bg-opacity-10"
    : "border-slate-700 hover:border-slate-500 bg-black bg-opacity-40 hover:bg-opacity-60";

  return (
    <div
      className={`group flex items-center rounded border transition-all duration-200 ${containerClass} ${focusClass}`.trim()}
    >
      <button
        type="button"
        className={`ml-2 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold ${
          isMultiSelected
            ? "border-[#ffe700] bg-[#ffe700] text-black"
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
        <span
          className="w-3 h-3 flex-shrink-0 rounded-sm"
          style={{ backgroundColor: entry.color }}
        />
        <span
          className={`text-xs truncate transition-colors ${
            isSelected ? "text-[#ffe700] font-medium" : "text-slate-300 group-hover:text-white"
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
