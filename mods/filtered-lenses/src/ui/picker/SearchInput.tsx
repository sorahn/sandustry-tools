type SearchInputProps = {
  inputRef?: (element: HTMLInputElement | null) => void;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onEscape: () => void;
  onClear?: () => void;
};

export const SearchInput = ({
  inputRef,
  value,
  placeholder,
  onChange,
  onEscape,
  onClear,
}: SearchInputProps) => (
  <div className="relative w-full">
    <input
      ref={inputRef}
      autoFocus
      value={value}
      placeholder={placeholder}
      maxLength={64}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") onEscape();
      }}
      className="w-full bg-black/60 border border-slate-700 px-3 py-1.5 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
    />
    {value && onClear ? (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs transition-colors"
        aria-label="Clear search"
      >
        ✕
      </button>
    ) : null}
  </div>
);
