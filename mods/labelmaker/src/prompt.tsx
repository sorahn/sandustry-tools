const PROMPT_ID = "sorahn-labelmaker-prompt";

type PromptRequest = {
  message: string;
  placeholder: string;
  title: string;
  resolve: (value: string | null) => void;
};

let promptRequest: PromptRequest | null = null;
let promptValue = "";
let promptRepaint: ((update: (value: number) => number) => void) | null = null;
let promptDispose: (() => void) | null = null;

function LabelmakerPrompt(): unknown {
  const React = sandkit.react;
  const [, repaint] = React.useState(0);

  React.useEffect(() => {
    promptRepaint = repaint;
    return () => {
      if (promptRepaint === repaint) promptRepaint = null;
    };
  }, []);

  if (!promptRequest) return null;

  const request = promptRequest;
  const finish = (value: string | null) => {
    promptRequest = null;
    promptRepaint?.((current) => current + 1);
    request.resolve(value);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-6"
      onClick={() => finish(null)}
    >
      <div
        className="w-[min(90vw,480px)] rounded border border-slate-700 bg-slate-950 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="font-mono text-sm font-bold text-white">{request.title}</div>
          <button
            type="button"
            className="sd-button sd-button--compact"
            aria-label="Close"
            onClick={() => finish(null)}
          >
            ✕
          </button>
        </div>
        <div className="mb-3 border-t border-slate-800 pt-3 text-sm leading-5 text-slate-300">
          {request.message}
        </div>
        <input
          id={`${PROMPT_ID}-input`}
          className="mb-4 w-full rounded border border-slate-700 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-slate-400"
          value={promptValue}
          placeholder={request.placeholder}
          autoFocus
          spellCheck={false}
          onChange={(event) => {
            promptValue = event.currentTarget.value;
            promptRepaint?.((current) => current + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") finish(promptValue);
            if (event.key === "Escape") finish(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="sd-button" onClick={() => finish(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="sd-button sd-button--accent"
            onClick={() => finish(promptValue)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function registerLabelmakerPrompt(): boolean {
  if (promptDispose) return true;
  try {
    const dispose = sandkit.api.ui.inject(PROMPT_ID, LabelmakerPrompt);
    if (typeof dispose !== "function") return false;
    promptDispose = dispose;
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
): Promise<string | null> {
  if (!registerLabelmakerPrompt())
    return sandkit.api.ui.prompt(message, defaultValue, placeholder, title);
  if (promptRequest) return Promise.resolve(null);

  promptValue = defaultValue;
  return new Promise((resolve) => {
    promptRequest = { message, placeholder, title, resolve };
    promptRepaint?.((current) => current + 1);
  });
}
