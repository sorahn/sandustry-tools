export type StructureEntry = {
  id: string;
  type: number | string;
  types?: (number | string)[];
  ids?: string[];
  name: string;
  categoryKey?: string;
  color: string;
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
