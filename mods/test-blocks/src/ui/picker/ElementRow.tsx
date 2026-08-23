import type { PickerElement } from "./pickerTypes";
import { ElementSwatch } from "./ElementSwatch";

type ElementRowProps = {
  element: PickerElement;
  selected: boolean;
  buttonRef?: (element: HTMLButtonElement | null) => void;
  onClick: () => void;
  className?: string;
};

export const ElementRow = ({
  element,
  selected,
  buttonRef,
  onClick,
  className: focusClass = "",
}: ElementRowProps) => {
  const rowClassName = selected
    ? "group flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border transition-all duration-200 border-[#ffe700] bg-[#ffe700]/10"
    : "group flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border transition-all duration-200 border-slate-700 hover:border-slate-500 bg-black/40 hover:bg-black/60";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`${rowClassName} ${focusClass}`.trim()}
    >
      <ElementSwatch element={element} />
      <span
        className={
          selected
            ? "text-xs truncate transition-colors text-[#ffe700]"
            : "text-xs truncate transition-colors text-slate-300 group-hover:text-white"
        }
      >
        {element.name}
      </span>
      {selected ? <span className="ml-auto text-[#ffe700] text-[10px]">✓</span> : null}
    </button>
  );
};
