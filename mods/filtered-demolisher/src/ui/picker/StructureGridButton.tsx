import type { StructureEntry } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

export const StructureGridButton = ({
  entry,
  index = 0,
  filtered,
  isSelected,
  onSelectSingle,
  onToggle,
  pickerId,
  scope,
  neighbors,
}: {
  entry: StructureEntry;
  index?: number;
  filtered?: StructureEntry[];
  isSelected: boolean;
  onSelectSingle: () => void;
  onToggle: () => void;
  pickerId: string;
  scope: string;
  neighbors?: Record<string, string | undefined>;
}) => {
  if (!UIReact) return null;
  const key = (value: StructureEntry) => `${pickerId}-struct-${value.id}`;
  const column = index % 3;
  const defaultNeighbors = filtered
    ? {
        left: column > 0 ? key(filtered[index - 1]) : undefined,
        right: column < 2 && filtered[index + 1] ? key(filtered[index + 1]) : undefined,
        up: index >= 3 ? key(filtered[index - 3]) : `${pickerId}-no-filter`,
        down: filtered[index + 3] ? key(filtered[index + 3]) : undefined,
      }
    : undefined;

  const focusable = api.ui.navigation.useFocusable({
    id: key(entry),
    scope,
    onActivate: onSelectSingle,
    scrollIntoView: true,
    neighbors: neighbors ?? defaultNeighbors,
  });

  const select = () => {
    focusable.focus();
    onSelectSingle();
  };

  const focusClass = api.ui.navigation.controllerFocusClass(focusable.focused);
  const containerClass = isSelected
    ? "border-[#ffe700] bg-[#ffe700]"
    : "border-slate-700 hover:border-slate-500 bg-black bg-opacity-40 hover:bg-opacity-60";

  return (
    <div
      className={`group flex items-center rounded border transition-all duration-200 ${containerClass} ${focusClass}`.trim()}
    >
      <button
        type="button"
        className={`ml-2 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold ${
          isSelected
            ? "border-black bg-black text-[#ffe700]"
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
        {entry.iconSrc ? (
          <div
            className="flex items-center justify-center flex-shrink-0 pointer-events-none overflow-hidden"
            style={{ width: "16px", height: "16px" }}
          >
            <img
              src={entry.iconSrc}
              alt=""
              draggable={false}
              style={
                entry.iconStyle || {
                  width: "16px",
                  height: "16px",
                  objectFit: "none",
                  objectPosition: "top left",
                  imageRendering: "pixelated",
                }
              }
            />
          </div>
        ) : (
          <span
            className="w-3.5 h-3.5 flex-shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
        )}
        <span
          className={`text-xs truncate transition-colors ${
            isSelected ? "text-black font-semibold" : "text-slate-300 group-hover:text-white"
          }`}
        >
          {entry.name}
        </span>
        {isSelected && <span className="ml-auto text-black font-bold text-[10px] pr-0.5">✓</span>}
      </button>
    </div>
  );
};
