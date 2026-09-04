export type TerrainSelection = {
  ids: string[];
  types: number[];
  entries: TerrainEntry[];
};

export type TerrainEntry = {
  id: string;
  type: number;
  name: string;
  color: string;
};

export type PickerState = {
  current: TerrainSelection;
  minimized: boolean;
  resolve: ((value: TerrainSelection | null) => void) | null;
};

export type PickerButtonProps = {
  id: string;
  onActivate: () => void;
  neighbors?: Record<string, string | undefined>;
  className?: string;
  children?: any;
  [key: string]: unknown;
};
