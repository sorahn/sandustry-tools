/**
 * Mod-agnostic data contracts for the Test Blocks picker UI.
 *
 * This module deliberately does not know about Source structures, Sandustry
 * storage, or the runtime API. Those concerns stay in the Source adapter.
 */

export type PickerSelection = {
  id: string | null;
  type: number | null;
};

export type PickerElement = {
  id: string | null;
  type: number;
  name: string;
  color: string;
  matterType?: number;
};

export type PickerMatterTab = {
  id: string;
  label: string;
  matterType?: number;
};

export type PickerMode = "compact" | "expanded";

export type PickerState = {
  selection: PickerSelection;
  mode: PickerMode;
};

export type PickerResolve = (selection: PickerSelection | null) => void;

export type PickerRuntimeState = {
  current: string | null;
  currentType: number | null;
  minimized: boolean;
  resolve: PickerResolve | null;
};
