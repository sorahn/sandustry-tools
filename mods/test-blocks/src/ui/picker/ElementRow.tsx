import type { PickerElement } from "./pickerTypes";
import { ElementSwatch } from "./ElementSwatch";
import { elementNameClass, elementRowClass } from "./styles";

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
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`${elementRowClass(selected)} ${focusClass}`.trim()}
    >
      <ElementSwatch element={element} />
      <span className={elementNameClass(selected)}>{element.name}</span>
      {selected ? <span className="ml-auto text-[#ffe700] text-[10px]">✓</span> : null}
    </button>
  );
};
