export type LabelmakerPromptState = {
  message: string;
  placeholder: string;
  title: string;
  fontOptions: readonly LabelmakerFontOption[];
};

export type LabelmakerFontOption = {
  readonly id: string;
  readonly label: string;
};

export type LabelmakerPromptResult = {
  text: string;
  fontId: string;
};

export type LabelmakerPromptProps = {
  prompt: LabelmakerPromptState | null;
  value: string;
  fontId: string;
  onChange: (value: string) => void;
  onFontChange: (fontId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onRegisterRepaint: (repaint: (update: (value: number) => number) => void) => () => void;
};
