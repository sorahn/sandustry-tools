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
      class={cx(
        "block rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-2",
        className,
      )}
    >
      <span className="block text-[10px] uppercase font-mono tracking-wider text-[var(--sd-color-text-subtle,#808080)]">
        {label}
      </span>
      {children ? (
        children
      ) : value !== undefined ? (
        <span
          className={cx(
            "block font-mono text-[var(--sd-color-text,#e8eef5)] font-medium",
            valueClassName,
          )}
        >
          {value}
        </span>
      ) : null}
      {subValue ? (
        <span className="block text-[var(--sd-color-text-subtle,#808080)] text-[10px] mt-0.5">
          {subValue}
        </span>
      ) : null}
    </sandustry-property-tile>
  );
}
