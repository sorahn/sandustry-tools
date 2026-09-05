import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import { CurrencyRow } from "./ResourceAmount";

export type SaveSlotCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title" | "onClick"> & {
  title: ReactNode;
  tag?: string;
  timestamp?: string;
  level?: number | string;
  playtime?: string;
  structures?: number | string;
  rate?: string;
  productionPoints?: number | string;
  currencies?: {
    credits?: number | string;
    fluxite?: number | string;
    artifact?: number | string;
  };
  selected?: boolean;
  actions?: ReactNode;
  onClick?: () => void;
};

export function SaveSlotCard({
  title,
  tag,
  timestamp,
  level,
  playtime,
  structures,
  rate,
  productionPoints,
  currencies,
  selected = false,
  actions,
  className = "",
  onClick,
  ...props
}: SaveSlotCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cx(
        "group relative rounded-lg border p-3.5 transition-all duration-150 select-none",
        onClick && "cursor-pointer",
        selected
          ? "border-slate-600 bg-slate-800/60 border-l-2 border-l-[#ffe700]"
          : "border-slate-700/40 bg-slate-900/30 hover:border-slate-600/60 hover:bg-slate-800/40",
        className,
      )}
      {...props}
    >
      {/* Header: Title, Tag badge, and Timestamp */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-white group-hover:text-yellow-300 transition-colors">
            {title}
          </span>
          {tag ? (
            <span className="shrink-0 rounded bg-slate-700/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
              {tag}
            </span>
          ) : null}
        </div>
        {timestamp ? (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
            {timestamp}
          </span>
        ) : null}
      </div>

      {/* Stats metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        {level !== undefined ? (
          <span className="inline-flex items-center gap-1 text-[#ffe700]">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4Zm.75 7a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5A.75.75 0 0 0 4.75 9Zm2.5-1.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm4-3.25a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-mono text-slate-300">
              {typeof level === "number" ? `Lv.${level}` : level}
            </span>
          </span>
        ) : null}

        {playtime ? (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-mono text-slate-300">{playtime}</span>
          </span>
        ) : null}

        {structures !== undefined ? (
          <span className="inline-flex items-center gap-1 text-[#e6a612]">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
            <span className="font-mono text-slate-300">{structures.toLocaleString()}</span>
          </span>
        ) : null}

        {(() => {
          const productionDisplay =
            productionPoints !== undefined
              ? typeof productionPoints === "number"
                ? productionPoints >= 1000
                  ? new Intl.NumberFormat("en-US", {
                      notation: "compact",
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }).format(productionPoints)
                  : productionPoints.toLocaleString()
                : productionPoints
              : rate;
          if (!productionDisplay) return null;
          return (
            <span className="inline-flex items-center gap-1 text-emerald-400/80">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3 shrink-0"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M15.22 6.268a.75.75 0 0 1 .968-.431l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.484a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.312l-6.22 6.22a.75.75 0 0 1-1.06-1.061l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.606a12.695 12.695 0 0 1 5.68-4.974l1.086-.483-4.251-1.632a.75.75 0 0 1-.432-.97Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-mono text-slate-300">{productionDisplay}</span>
            </span>
          );
        })()}
      </div>

      {/* Currencies & Actions Footer */}
      {currencies || actions ? (
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-700/30 pt-2">
          {currencies ? (
            <CurrencyRow
              credits={currencies.credits}
              fluxite={currencies.fluxite}
              artifact={currencies.artifact}
            />
          ) : (
            <div />
          )}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
