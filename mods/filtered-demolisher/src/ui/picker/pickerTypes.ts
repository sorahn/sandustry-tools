export type StructureIconStyle = {
  width?: string;
  height?: string;
  objectFit: "none";
  objectPosition: string;
  imageRendering: "pixelated";
  clipPath?: string;
  transform?: string;
  transformOrigin?: string;
};

export type StructureEntry = {
  id: string;
  type: number | string;
  types?: (number | string)[];
  ids?: string[];
  name: string;
  categoryKey?: string;
  categoryTitle?: string;
  color: string;
  order?: number;
  iconSrc?: string;
  iconStyle?: StructureIconStyle;
};

export type StructureSelection = {
  ids: string[];
  types: (number | string)[];
  entries: StructureEntry[];
};

export type PickerState = {
  current: StructureSelection;
  minimized: boolean;
  resolve: ((selection: StructureSelection | null) => void) | null;
};

export type PickerButtonProps = {
  id: string;
  onActivate: () => void;
  neighbors?: Record<string, string | undefined>;
  className?: string;
  children?: any;
  [key: string]: unknown;
};
