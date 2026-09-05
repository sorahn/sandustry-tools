import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";

export type ToastVariant = "default" | "hint" | "danger";

export type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  message: ReactNode;
  title?: ReactNode;
  variant?: ToastVariant;
  icon?: ReactNode;
  onClose?: () => void;
};

export function Toast({
  message,
  title,
  variant = "default",
  icon,
  onClose,
  className = "",
  ...props
}: ToastProps) {
  const isHint = variant === "hint";
  const isDanger = variant === "danger";

  const accentColor = isDanger ? "#f87171" : isHint ? "#8fd3ff" : "#ffe700";

  const defaultIcon = isDanger ? (
    <span className="text-red-400 font-bold" aria-hidden="true">
      ✕
    </span>
  ) : isHint ? (
    <span className="text-[#8fd3ff] font-bold" aria-hidden="true">
      ℹ
    </span>
  ) : (
    <span className="text-[#ffe700] font-bold" aria-hidden="true">
      ✦
    </span>
  );

  return (
    <div
      role="status"
      className={cx(
        "relative flex items-center justify-between gap-3 overflow-hidden backdrop-blur-md transition-all duration-200",
        "rounded-tr-md rounded-br-md text-white select-none",
        isHint
          ? "bg-black/65 px-4 py-2 text-sm tracking-wide"
          : "bg-black/75 px-5 py-2.5 text-base tracking-wider",
        className,
      )}
      style={{
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderLeft: `${isHint ? 1 : 2}px solid ${accentColor}`,
        boxShadow: isDanger
          ? "0 4px 20px rgba(0, 0, 0, 0.4), 0 0 8px rgba(248, 113, 113, 0.08)"
          : isHint
            ? "0 3px 14px rgba(0, 0, 0, 0.32), 0 0 6px rgba(143, 211, 255, 0.04)"
            : "0 4px 20px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 231, 0, 0.06)",
      }}
      {...props}
    >
      {/* Native subtle horizontal accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${
            isDanger
              ? "rgba(248, 113, 113, 0.05)"
              : isHint
                ? "rgba(143, 211, 255, 0.035)"
                : "rgba(255, 231, 0, 0.04)"
          } 0%, transparent 40%)`,
        }}
      />

      <div className="relative flex items-center gap-2.5 min-w-0">
        <span className="shrink-0 flex items-center justify-center">{icon ?? defaultIcon}</span>
        <div className="flex flex-col min-w-0">
          {title ? (
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              {title}
            </span>
          ) : null}
          <span className="truncate text-slate-100 font-medium">{message}</span>
        </div>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss toast"
          className="relative ml-2 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 1L9 9M9 1L1 9" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function ToastContainer({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cx(
        "pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2",
        className,
      )}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    </div>
  );
}
