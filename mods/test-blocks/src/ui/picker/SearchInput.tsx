type SearchInputProps = {
  inputRef?: (element: HTMLInputElement | null) => void;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onEscape: () => void;
};

export const SearchInput = ({
  inputRef,
  value,
  placeholder,
  onChange,
  onEscape,
}: SearchInputProps) => (
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
);
