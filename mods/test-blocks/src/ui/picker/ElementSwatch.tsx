import type { PickerElement } from "./pickerTypes";

type ElementSwatchProps = {
  element: Pick<PickerElement, "color">;
};

export const ElementSwatch = ({ element }: ElementSwatchProps) => (
  <span
    className="w-3 h-3 flex-shrink-0"
    style={{
      backgroundColor: element.color,
      boxShadow: `0 0 6px ${element.color}80`,
    }}
  />
);
