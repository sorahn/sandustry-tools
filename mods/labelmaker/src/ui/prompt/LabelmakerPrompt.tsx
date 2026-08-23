import type { LabelmakerPromptProps } from "./promptTypes";

const UIReact = sandkit.react ?? null;

export const LabelmakerPrompt = ({
  prompt,
  value,
  fontId,
  onChange,
  onFontChange,
  onCancel,
  onConfirm,
}: LabelmakerPromptProps) => {
  if (!UIReact) return null;
  const [dismissed, setDismissed] = UIReact.useState(false);

  UIReact.useEffect(() => {
    if (prompt) setDismissed(false);
  }, [prompt]);
  UIReact.useEffect(() => {
    if (!prompt) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setDismissed(true);
      onCancel();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel, prompt]);

  if (!prompt || dismissed) return null;

  const cancel = () => {
    setDismissed(true);
    onCancel();
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div
        className="w-[400px] max-w-[90vw] rounded border border-slate-700 bg-slate-950 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="font-mono text-sm font-bold text-white">{prompt.title}</div>
          <button
            type="button"
            className="sd-button sd-button--compact"
            aria-label="Close"
            onClick={cancel}
          >
            ✕
          </button>
        </div>
        <div className="mb-3 border-t border-slate-800 pt-3 text-sm leading-5 text-slate-300">
          {prompt.message}
        </div>
        <input
          id="sorahn-labelmaker-prompt-input"
          className="mb-4 w-full rounded border border-slate-700 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-slate-400"
          value={value}
          placeholder={prompt.placeholder}
          autoFocus
          spellCheck={false}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onConfirm();
            if (event.key === "Escape") cancel();
          }}
        />
        <label className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-300">
          <span>Font</span>
          <select
            className="min-w-0 flex-1 rounded border border-slate-700 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-slate-400"
            value={fontId}
            onChange={(event) => onFontChange(event.currentTarget.value)}
          >
            {prompt.fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="sd-button" onClick={cancel}>
            Cancel
          </button>
          <button type="button" className="sd-button sd-button--accent" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
