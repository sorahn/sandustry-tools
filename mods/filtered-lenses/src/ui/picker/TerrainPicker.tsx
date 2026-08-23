import {
  EARTH_FILTER_ENTRY,
  EARTH_FILTER_ID,
  NO_FILTER_ENTRY,
  NO_FILTER_ID,
} from "../../terrainCatalog";
import { FilterOptionButton } from "./FilterOptionButton";
import { FocusableButton } from "./FocusableButton";
import { SearchInput } from "./SearchInput";
import { TerrainGridButton } from "./TerrainGridButton";
import type { PickerState, TerrainEntry, TerrainSelection } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

type TerrainPickerProps = {
  picker: PickerState | null;
  entries: TerrainEntry[];
  pickerId: string;
  scope: string;
  onOpen: (current: TerrainSelection) => void;
  onClose: (selection: TerrainSelection | null) => void;
  onMinimize: () => void;
  onRegisterRepaint: (repaint: (update: (value: number) => number) => void) => () => void;
};

export const TerrainPicker = ({
  picker,
  entries,
  pickerId,
  scope,
  onOpen,
  onClose,
  onMinimize,
  onRegisterRepaint,
}: TerrainPickerProps) => {
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
    const selected =
      picker.current.id === NO_FILTER_ID
        ? NO_FILTER_ENTRY
        : picker.current.id === EARTH_FILTER_ID
          ? EARTH_FILTER_ENTRY
          : entries.find((entry) => entry.type === picker.current.type);
    return (
      <div
        className="pointer-events-auto flex items-center gap-2 bg-black bg-opacity-75 border border-slate-700 rounded px-3 py-2 ui-box text-slate-300"
        onClick={() => onOpen(picker.current)}
      >
        <span className="text-white text-xs opacity-70">Laser filter</span>
        <FocusableButton
          id={`${pickerId}-selected`}
          scope={scope}
          onActivate={() => onOpen(picker.current)}
          className="flex items-center gap-2 text-xs text-white"
        >
          <span className="w-3 h-3" style={{ backgroundColor: selected?.color || "#9aa7b5" }} />
          {selected?.name || "No terrain"}
        </FocusableButton>
        <span className="text-xs text-slate-500">Click to expand</span>
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
  const firstTerrainId = filtered[0]
    ? `${pickerId}-terrain-${filtered[0].id || `type-${filtered[0].type}`}`
    : undefined;

  return (
    <div
      className="pointer-events-auto flex min-h-0 flex-col overflow-hidden bg-black bg-opacity-75 border border-slate-700 rounded ui-box text-slate-300"
      style={{ width: "640px", maxWidth: "640px", maxHeight: "600px" }}
    >
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-white text-xs opacity-70">Laser filter</span>
        <FocusableButton
          id={`${pickerId}-minimize`}
          scope={scope}
          onActivate={onMinimize}
          neighbors={{ down: `${pickerId}-search` }}
          className="text-xs px-2 py-0.5 text-white bg-black border rounded"
        >
          Minimize ▾
        </FocusableButton>
      </div>
      <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-2 items-stretch">
        <SearchInput
          inputRef={search.ref}
          value={query}
          placeholder="Search terrain..."
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
            selected={picker.current.id === NO_FILTER_ID}
            onSelect={() => onClose(NO_FILTER_ENTRY)}
            pickerId={pickerId}
            scope={scope}
          />
          <FilterOptionButton
            entry={EARTH_FILTER_ENTRY}
            selected={picker.current.id === EARTH_FILTER_ID}
            onSelect={() => onClose(EARTH_FILTER_ENTRY)}
            pickerId={pickerId}
            scope={scope}
            down={firstTerrainId}
            description="Dirt, Grass, Moss, Vine, Earth Strataform"
          />
        </div>
        {filtered.length ? (
          <div className="grid grid-cols-4 gap-1.5 py-1.5">
            {filtered.map((entry, index) => (
              <TerrainGridButton
                key={entry.id}
                entry={entry}
                index={index}
                filtered={filtered}
                selected={entry.id === picker.current.id}
                onSelect={() => onClose(entry)}
                pickerId={pickerId}
                scope={scope}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-600">
            <span className="text-xs">
              {query.trim() ? `No terrains match “${query.trim()}”.` : "No terrains available."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
