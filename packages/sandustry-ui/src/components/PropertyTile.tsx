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
  return (
    <sandustry-property-tile
      title={title}
      {...props}
      class={cx(
        "block rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-2",
        className,
      )}
    >
      <span
        slot="label"
        className="block text-[10px] uppercase font-mono tracking-wider text-[var(--sd-color-text-subtle,#808080)]"
      >
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
        <span
          slot="subValue"
          className="block text-[var(--sd-color-text-subtle,#808080)] text-[10px] mt-0.5"
        >
          {subValue}
        </span>
      ) : null}
    </sandustry-property-tile>
  );
}
