export type LabelmakerPromptState = {
  message: string;
  placeholder: string;
  title: string;
  fontGroups: readonly LabelmakerFontGroup[];
};

export type LabelmakerFontOption = {
  readonly id: string;
  readonly label: string;
  readonly retro?: boolean;
};

export type LabelmakerFontGroup = {
  readonly label: string;
  readonly options: readonly LabelmakerFontOption[];
};

export type LabelmakerPromptResult = {
  text: string;
  fontId: string;
  color: string;
};

export type LabelmakerPromptProps = {
  prompt: LabelmakerPromptState | null;
  value: string;
  fontId: string;
  color: string;
  onChange: (value: string) => void;
  onFontChange: (fontId: string) => void;
  onColorChange: (color: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};
