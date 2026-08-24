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
      className="pointer-events-auto fixed inset-0 z-[10007] flex items-center justify-center bg-black bg-opacity-50"
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div
        style={{
          width: 400,
          height: "auto",
          transform: "scale(0.7)",
          transformOrigin: "center center",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-full bg-black bg-opacity-85 p-4 shadow-lg ui-box card-2 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white">{prompt.title}</h2>
            <button
              type="button"
              className="text-white hover:text-[#ffe700] transition-colors"
              aria-label="Close"
              onClick={cancel}
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-white whitespace-pre-wrap">{prompt.message}</div>
            <div className="flex gap-2">
              <input
                id="sorahn-labelmaker-prompt-input"
                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-[#ffe700] outline-none"
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
            </div>
            <label className="flex items-center gap-2 text-white">
              <span>Font</span>
              <select
                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-[#ffe700] outline-none"
                value={fontId}
                onChange={(event) => onFontChange(event.currentTarget.value)}
              >
                {prompt.fontGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {prompt.fontGroups.some((group) =>
              group.options.some((font) => font.id === fontId && font.retro),
            ) ? (
              <div className="text-amber-300 text-sm">
                Retro fonts have basic character and symbol support.
              </div>
            ) : null}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                onClick={cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-[#ffe700] hover:bg-[#ffe700] text-black rounded font-bold transition-colors"
                onClick={onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
