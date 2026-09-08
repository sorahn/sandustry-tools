import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";

export type KeycapProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement>> & {
  variant?: "keycap" | "bracket" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Keycap({
  children,
  variant = "keycap",
  size = "md",
  className = "",
  style,
  ...props
}: KeycapProps) {
  if (variant === "bracket") {
    return (
      <span
        className={cx(
          "inline-flex select-none font-mono font-bold tracking-wider text-[#ffe700] sd-drop-shadow",
          size === "sm" && "text-[10px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
          className,
        )}
        style={style}
        {...props}
      >
        [{children}]
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span
        className={cx(
          "inline-flex select-none items-center justify-center rounded border border-yellow-300/40 bg-yellow-300/10 font-mono font-bold text-[#ffe700]",
          size === "sm" && "h-5 min-w-[1.25rem] px-1 text-[10px]",
          size === "md" && "h-6 min-w-[1.5rem] px-1.5 text-xs",
          size === "lg" && "h-7 min-w-[1.75rem] px-2 text-sm",
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cx(
        "inline-flex select-none items-center justify-center rounded border border-[#444] font-bold text-[#ffe700]",
        "sd-keycap-3d",
        size === "sm" && "h-5 min-w-[1.25rem] px-1 text-[10px]",
        size === "md" && "h-7 min-w-[1.75rem] px-2 text-xs",
        size === "lg" && "h-8 min-w-[2rem] px-2.5 text-sm",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
