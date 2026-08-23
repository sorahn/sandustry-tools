import { onDispose } from "../../../shared/dev-hmr";
import { LabelmakerPrompt } from "./ui/prompt/LabelmakerPrompt";
import type { LabelmakerPromptResult, LabelmakerPromptState } from "./ui/prompt/promptTypes";

const PROMPT_ID = "sorahn-labelmaker-prompt";
const api = sandkit.api;

type PromptRequest = LabelmakerPromptState & {
  resolve: (value: LabelmakerPromptResult | null) => void;
};

let promptRequest: PromptRequest | null = null;
let promptValue = "";
let promptFontId = "";
let promptRepaint: ((update: (value: number) => number) => void) | null = null;
let promptDispose: (() => void) | null = null;

const refreshPrompt = () => {
  promptRepaint?.((current) => current + 1);
  try {
    api.ui.update(PROMPT_ID);
  } catch (error) {
    console.warn("[Labelmaker] prompt refresh failed:", error);
  }
};

const registerPromptRepaint = (repaint: (update: (value: number) => number) => void) => {
  promptRepaint = repaint;
  return () => {
    if (promptRepaint === repaint) promptRepaint = null;
  };
};

const UIReact = sandkit.react ?? null;

const finishPrompt = (value: LabelmakerPromptResult | null) => {
  if (!promptRequest) return;
  const resolve = promptRequest.resolve;
  promptRequest = null;
  resolve(value);
  refreshPrompt();
};

export function cancelLabelmakerPrompt(): void {
  finishPrompt(null);
}

const renderPrompt = () => (UIReact ? <LabelmakerPromptHost /> : null);

const LabelmakerPromptHost = () => {
  if (!UIReact) return null;
  const [, repaint] = UIReact.useState(0);

  UIReact.useEffect(() => registerPromptRepaint(repaint), [repaint]);

  return (
    <LabelmakerPrompt
      key={promptRequest ? "open" : "closed"}
      prompt={promptRequest}
      value={promptValue}
      fontId={promptFontId}
      onChange={(value) => {
        promptValue = value;
        refreshPrompt();
      }}
      onFontChange={(fontId) => {
        promptFontId = fontId;
        refreshPrompt();
      }}
      onCancel={() => finishPrompt(null)}
      onConfirm={() => finishPrompt({ text: promptValue, fontId: promptFontId })}
    />
  );
};

export function registerLabelmakerPrompt(): boolean {
  if (promptDispose) return true;
  try {
    const dispose = api.ui.inject(PROMPT_ID, renderPrompt);
    if (typeof dispose !== "function") return false;
    promptDispose = dispose;
    onDispose(() => {
      promptDispose?.();
      promptDispose = null;
      const request = promptRequest;
      promptRequest = null;
      promptRepaint = null;
      request?.resolve(null);
    });
    return true;
  } catch (error) {
    console.warn("[Labelmaker] custom prompt unavailable:", error);
    return false;
  }
}

export function openLabelmakerPrompt(
  message: string,
  defaultValue: string,
  placeholder: string,
  title: string,
  fontOptions: LabelmakerPromptState["fontOptions"],
  defaultFontId: string,
): Promise<LabelmakerPromptResult | null> {
  if (promptRequest) finishPrompt(null);
  if (!registerLabelmakerPrompt()) {
    return api.ui
      .prompt(message, defaultValue, placeholder, title)
      .then((text) => (text === null ? null : { text, fontId: defaultFontId }));
  }
  promptValue = defaultValue;
  promptFontId = defaultFontId;
  return new Promise((resolve) => {
    promptRequest = { message, placeholder, title, fontOptions, resolve };
    refreshPrompt();
  });
}
