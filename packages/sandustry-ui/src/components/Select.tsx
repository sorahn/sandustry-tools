import type { PropsWithChildren, SelectHTMLAttributes } from "react";
import cx from "clsx";
import styles from "../styles/select.module.css";
import type { ControlSize } from "../types";

export type SelectProps = PropsWithChildren<
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    size?: ControlSize;
    compact?: boolean;
  }
>;

export function Select({ size, compact = false, className = "", children, ...props }: SelectProps) {
  const effectiveSize: ControlSize = size ?? (compact ? "small" : "default");

  return (
    <span className={styles.selectWrap}>
      <select
        className={cx(
          "appearance-none rounded-[var(--sd-radius)_0_var(--sd-radius)_0] border border-slate-700 bg-black/70 font-mono text-slate-200 focus:border-slate-500 focus:outline-2 focus:outline-yellow-300 focus:outline-offset-2",
          effectiveSize === "small" && "min-h-0 py-1 px-2 pr-5 text-xs",
          effectiveSize === "default" &&
            "min-h-[var(--sd-control-height)] px-2.5 py-1.5 pr-5 text-[11px] leading-normal",
          effectiveSize === "large" && "min-h-10 px-3 py-2 pr-6 text-xs leading-normal",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </span>
  );
}
