import { FocusableButton } from "./FocusableButton";
import type { TerrainEntry } from "./pickerTypes";

const UIReact = sandkit.react ?? null;

const optionClass = (selected: boolean) =>
  `flex-1 flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border ${
    selected
      ? "border-[#ffe700] bg-[#ffe700]/10"
      : "border-slate-700 hover:border-slate-500 bg-black/40 hover:bg-black/60"
  }`;

export const FilterOptionButton = ({
  entry,
  selected,
  onSelect,
  pickerId,
  scope,
  down,
  description,
}: {
  entry: TerrainEntry;
  selected: boolean;
  onSelect: () => void;
  pickerId: string;
  scope: string;
  down?: string;
  description?: string;
}) => {
  if (!UIReact) return null;
  const id = `${pickerId}-${entry.id}`;
  return (
    <FocusableButton
      id={id}
      scope={scope}
      onActivate={onSelect}
      neighbors={{
        up: entry.id === "no-filter" ? `${pickerId}-search` : `${pickerId}-no-filter`,
        down,
      }}
      className={optionClass(selected)}
    >
      <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: entry.color }} />
      <span className={selected ? "text-xs text-[#ffe700]" : "text-xs text-slate-300"}>
        {entry.name}
      </span>
      {description ? <span className="text-[10px] text-slate-500">{description}</span> : null}
    </FocusableButton>
  );
};
