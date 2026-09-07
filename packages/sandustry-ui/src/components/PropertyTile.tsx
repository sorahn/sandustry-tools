import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";

export type PropertyTileProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    label: ReactNode;
    value?: ReactNode;
    subValue?: ReactNode;
    title?: string;
    valueClassName?: string;
  }
>;

export function PropertyTile({
  label,
  value,
  subValue,
  title,
  valueClassName = "",
  className = "",
  children,
  ...props
}: PropertyTileProps) {
  return (
    <div
      title={title}
      {...props}
      className={cx("rounded border border-slate-800/60 bg-slate-950/50 p-2", className)}
    >
      <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
        {label}
      </span>
      {children ? (
        children
      ) : value !== undefined ? (
        <span className={cx("block font-mono text-slate-200 font-medium", valueClassName)}>
          {value}
        </span>
      ) : null}
      {subValue ? (
        <span className="block text-slate-600 text-[10px] mt-0.5">{subValue}</span>
      ) : null}
    </div>
  );
}
