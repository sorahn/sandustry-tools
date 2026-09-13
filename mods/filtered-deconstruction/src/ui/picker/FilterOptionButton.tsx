import { FocusableButton } from "./FocusableButton";
import type { StructureEntry } from "./pickerTypes";

const UIReact = sandkit.react ?? null;

const optionClass = (selected: boolean) =>
  `flex-1 flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border ${
    selected
      ? "border-[#ffe700] bg-[#ffe700] bg-opacity-10"
      : "border-slate-700 hover:border-slate-500 bg-black bg-opacity-40 hover:bg-opacity-60"
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
  entry: StructureEntry;
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
      <span className={selected ? "text-xs text-[#ffe700]" : "text-xs text-slate-300"}>
        {entry.name}
      </span>
      {description ? <span className="text-[10px] text-slate-500">{description}</span> : null}
    </FocusableButton>
  );
};
