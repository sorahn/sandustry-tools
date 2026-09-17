import cx from "clsx";

export function PipeLayerControl({
  active,
  onActiveChange,
}: {
  active: boolean;
  onActiveChange: (active: boolean) => void;
}) {
  const action = active ? "Hide" : "Show";

  return (
    <button
      type="button"
      aria-label={`${action} pipe layer`}
      aria-pressed={active}
      title={`${action} pipe layer`}
      onClick={() => onActiveChange(!active)}
      className={cx(
        "group flex w-[4.5rem] flex-col items-center gap-1 rounded border bg-slate-950/85 p-1.5 font-mono shadow-lg backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:outline-none",
        active
          ? "border-yellow-400 text-yellow-300"
          : "border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white",
      )}
    >
      <span
        className={cx(
          "relative flex h-10 w-full items-center justify-center overflow-hidden rounded-sm border transition-colors",
          active ? "border-yellow-400/80" : "border-slate-600 group-hover:border-slate-400",
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 56 40" className="h-full w-full" role="presentation">
          <rect width="56" height="40" fill="#33a8ff" />
          <path d="M0 10H56M0 20H56M0 30H56M14 0V40M28 0V40M42 0V40" stroke="#168bd7" />
          <path
            d="M8 28H28V8M28 28H48"
            fill="none"
            stroke="#111827"
            strokeWidth="8"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M8 28H28V8M28 28H48"
            fill="none"
            stroke="#777c80"
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path d="M8 24V32M24 8H32M48 24V32" stroke="#ffe700" strokeWidth="5" />
        </svg>
        {active ? (
          <span className="absolute top-0.5 right-0.5 flex size-3 items-center justify-center rounded-full bg-yellow-400 text-[9px] leading-none font-bold text-slate-950">
            ✓
          </span>
        ) : null}
      </span>
      <span className="text-[10px] leading-none font-semibold tracking-wide">Pipes</span>
    </button>
  );
}
