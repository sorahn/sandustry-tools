import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";

export type BuildingTileProps = Omit<HTMLAttributes<HTMLButtonElement>, "children"> & {
  label: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  hotkey?: string;
  badge?: ReactNode;
  size?: "md" | "sm";
};

export function BuildingTile({
  label,
  icon,
  selected = false,
  disabled = false,
  hotkey,
  badge,
  size = "md",
  className = "",
  onClick,
  ...props
}: BuildingTileProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "group flex flex-col items-center text-center select-none transition-transform focus:outline-none",
        isSm ? "w-14" : "w-16",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...props}
    >
      <div className="relative inline-block">
        <div
          className={cx(
            "relative flex items-center justify-center border ring-2 ring-black ring-inset shadow-md cursor-pointer transition-all duration-200",
            "rounded-tr-md rounded-bl-md active:brightness-125",
            isSm ? "h-14 w-14" : "h-16 w-16",
            selected
              ? "border-[#ffe700] shadow-[0_0_10px_rgba(255,231,0,0.35)]"
              : "border-slate-200/25 hover:border-slate-200/60",
          )}
          style={{
            background:
              "radial-gradient(circle, rgba(100, 100, 100, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%)",
          }}
        >
          {/* Inner sprite frame matching native 32x32 cell outline */}
          <div
            className={cx(
              "flex items-center justify-center overflow-hidden rounded outline outline-2 outline-black pointer-events-none",
              isSm ? "h-7 w-7" : "h-8 w-8",
            )}
          >
            {icon}
          </div>

          {/* Optional corner hotkey or badge */}
          {hotkey ? (
            <span className="absolute left-1 top-0.5 font-mono text-[9px] font-bold text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {hotkey}
            </span>
          ) : null}

          {badge ? (
            <span className="absolute right-1 top-0.5 font-mono text-[9px] text-slate-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {badge}
            </span>
          ) : null}
        </div>
      </div>

      {label ? (
        <p
          className={cx(
            "mt-1.5 w-full leading-tight line-clamp-2 text-ellipsis",
            isSm ? "text-[11px]" : "text-xs",
            selected ? "text-yellow-300 font-medium" : "text-slate-200 group-hover:text-white",
          )}
        >
          {label}
        </p>
      ) : null}
    </button>
  );
}
