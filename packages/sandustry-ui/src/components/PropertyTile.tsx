import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/property-tile";

export type PropertyTileProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLElement>, "title"> & {
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
  const isStringLabel = typeof label === "string";
  const isStringValue = typeof value === "string" || typeof value === "number";
  const isStringSubValue = typeof subValue === "string";

  return (
    <sandustry-property-tile
      title={title}
      label={isStringLabel ? label : undefined}
      value={isStringValue ? String(value) : undefined}
      subValue={isStringSubValue ? subValue : undefined}
      {...props}
      class={cx("block rounded border border-slate-800/60 bg-slate-950/50 p-2", className)}
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
    </sandustry-property-tile>
  );
}
