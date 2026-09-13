import {
  NO_FILTER_ENTRY,
  NO_FILTER_ID,
  NO_FILTER_SELECTION,
  isNoFilter,
} from "../../structureCatalog";
import { FilterOptionButton } from "./FilterOptionButton";
import { FocusableButton } from "./FocusableButton";
import { SearchInput } from "./SearchInput";
import { StructureGridButton } from "./StructureGridButton";
import type { PickerState, StructureEntry, StructureSelection } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

type StructurePickerProps = {
  picker: PickerState | null;
  entries: StructureEntry[];
  pickerId: string;
  scope: string;
  onOpen: (current: StructureSelection) => void;
  onClose: (selection: StructureSelection | null) => void;
  onUpdate: (selection: StructureSelection) => void;
  onMinimize: () => void;
  onRegisterRepaint: (repaint: (update: (value: number) => number) => void) => () => void;
};

const SelectedPills = ({ elements }: { elements: StructureEntry[] }) => (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
    {elements.slice(0, 5).map((entry, idx) => (
      <div key={entry.id} className="flex items-center gap-1.5">
        {idx > 0 && <span className="text-slate-500">,</span>}
        <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-white text-xs">{entry.name}</span>
      </div>
    ))}
    {elements.length > 5 && (
      <span className="text-slate-400 text-xs">+{elements.length - 5} more</span>
    )}
  </div>
);

export const StructurePicker = ({
  picker,
  entries,
  pickerId,
  scope,
  onOpen,
  onClose,
  onUpdate,
  onMinimize,
  onRegisterRepaint,
}: StructurePickerProps) => {
  if (!UIReact) return null;
  const [query, setQuery] = UIReact.useState("");
  const [, bump] = UIReact.useState(0);

  api.ui.navigation.useFocusScope({
    id: scope,
    active: !!picker,
    priority: 100,
    defaultId: picker?.minimized ? `${pickerId}-selected` : `${pickerId}-search`,
    onBack: () => {
      if (picker && !picker.minimized) {
        onMinimize();
        return true;
      }
      onClose(null);
      return true;
    },
  });

  UIReact.useEffect(() => onRegisterRepaint(bump), [bump, onRegisterRepaint]);

  const search = api.ui.navigation.useFocusable({
    id: `${pickerId}-search`,
    scope,
    onActivate: (element: HTMLElement | null) => element?.focus(),
    neighbors: { up: `${pickerId}-minimize`, down: `${pickerId}-${NO_FILTER_ID}` },
    scrollIntoView: true,
  });

  if (!picker) return null;

  if (picker.minimized) {
    const noFilter = isNoFilter(picker.current);
    return (
      <div
        className="pointer-events-auto flex items-center gap-3 bg-black bg-opacity-75 border border-slate-700 rounded px-3 py-2 ui-box text-slate-300 cursor-pointer"
        onClick={() => onOpen(picker.current)}
      >
        <span className="text-white text-xs font-semibold">Deconstruct filter</span>
        <FocusableButton
          id={`${pickerId}-selected`}
          scope={scope}
          onActivate={() => onOpen(picker.current)}
          className="flex items-center gap-2 text-xs text-white"
        >
          {noFilter ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: "#9aa7b5" }} />
              <span className="text-white text-xs">[No filter]</span>
            </div>
          ) : (
            <SelectedPills elements={picker.current.entries} />
          )}
        </FocusableButton>
        <span className="text-white/70 text-[10px]">Click to expand</span>
      </div>
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = entries.filter(
    (entry) =>
      !normalizedQuery ||
      entry.name.toLowerCase().includes(normalizedQuery) ||
      entry.id.toLowerCase().includes(normalizedQuery),
  );
  const firstStructureId = filtered[0] ? `${pickerId}-struct-${filtered[0].id}` : undefined;

  const selectedIdSet = new Set(isNoFilter(picker.current) ? [] : picker.current.ids);
  const isMulti = selectedIdSet.size > 1;

  return (
    <div
      className="pointer-events-auto flex min-h-0 flex-col overflow-hidden bg-black bg-opacity-75 border border-slate-700 rounded ui-box text-slate-300"
      style={{ width: "640px", maxWidth: "640px", maxHeight: "600px" }}
    >
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-semibold">Deconstruct filter</span>
          {!isNoFilter(picker.current) && (
            <span className="text-[10px] text-[#ffe700]">
              {picker.current.entries.length} selected
            </span>
          )}
        </div>
        <FocusableButton
          id={`${pickerId}-minimize`}
          scope={scope}
          onActivate={onMinimize}
          neighbors={{ down: `${pickerId}-search` }}
          className="text-xs px-2 py-0.5 text-white bg-black border rounded-tr-lg rounded-bl-lg item-button-transition hover:text-[#ffe700] border-slate-200 border-opacity-25 hover:border-opacity-0"
        >
          Minimize ▾
        </FocusableButton>
      </div>

      <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-2 items-stretch">
        <SearchInput
          inputRef={search.ref}
          value={query}
          placeholder="Search structures..."
          onChange={setQuery}
          onEscape={onMinimize}
          onClear={() => setQuery("")}
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
        style={{ maxHeight: "min(480px, calc(100vh - 190px))" }}
      >
        <div className="flex gap-1.5 border-b border-slate-800 pb-2 mb-1">
          <FilterOptionButton
            entry={NO_FILTER_ENTRY}
            selected={isNoFilter(picker.current)}
            onSelect={() => onClose(NO_FILTER_SELECTION)}
            pickerId={pickerId}
            scope={scope}
            down={firstStructureId}
            description="Deconstruct all structures without filtering"
          />
        </div>

        {filtered.length ? (
          <div className="grid grid-cols-4 gap-1.5 py-1.5">
            {filtered.map((entry, index) => {
              const isSelected = selectedIdSet.has(entry.id);
              const isMultiSelected = isMulti && isSelected;
              return (
                <StructureGridButton
                  key={entry.id}
                  entry={entry}
                  index={index}
                  filtered={filtered}
                  isSelected={isSelected}
                  isMultiSelected={isMultiSelected}
                  onSelectSingle={() => {
                    onClose({
                      ids: [entry.id],
                      types: [entry.type],
                      entries: [entry],
                    });
                  }}
                  onToggle={() => {
                    let nextEntries: StructureEntry[];
                    if (isSelected) {
                      nextEntries = picker.current.entries.filter((e) => e.id !== entry.id);
                    } else {
                      nextEntries = isNoFilter(picker.current)
                        ? [entry]
                        : [...picker.current.entries, entry];
                    }
                    if (nextEntries.length === 0) {
                      onUpdate(NO_FILTER_SELECTION);
                    } else {
                      onUpdate({
                        ids: nextEntries.map((e) => e.id),
                        types: nextEntries.map((e) => e.type),
                        entries: nextEntries,
                      });
                    }
                  }}
                  pickerId={pickerId}
                  scope={scope}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-600">
            <span className="text-xs">
              {query.trim() ? `No structures match “${query.trim()}”.` : "No structures available."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
