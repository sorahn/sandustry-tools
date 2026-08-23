export type TerrainSelection = { id: string; type: number };

export type TerrainEntry = TerrainSelection & {
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
