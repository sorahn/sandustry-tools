import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import "../elements/metadata-row";

export type MetadataItem = {
  label?: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "accent" | "muted" | "success" | "warning";
};

export type MetadataRowProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  items: readonly MetadataItem[];
  wrap?: boolean;
};

export function MetadataRow({ items, wrap = true, className = "", ...props }: MetadataRowProps) {
  return (
    <sandustry-metadata-row
      wrap={wrap ? "" : undefined}
      class={cx("flex items-center gap-x-4 gap-y-1 text-[11px]", wrap && "flex-wrap", className)}
      {...props}
    >
      {items.map((item, index) => (
        <span
          key={index}
          className={cx(
            "inline-flex items-center gap-1",
            item.tone === "accent" && "text-[var(--sd-color-primary,#ffe700)]",
            item.tone === "muted" && "text-[var(--sd-color-text-muted,#94a3b8)]",
            item.tone === "success" && "text-[var(--sd-color-success,#34d399)]",
            item.tone === "warning" && "text-[var(--sd-color-warning,#ffa500)]",
            (!item.tone || item.tone === "default") && "text-[var(--sd-color-text,#ffffff)]",
          )}
        >
          {item.icon ? <span className="h-3 w-3 shrink-0">{item.icon}</span> : null}
          {item.label ? (
            <span className="text-[var(--sd-color-text-muted,#94a3b8)]">{item.label}</span>
          ) : null}
          <span className="tabular-nums">{item.value}</span>
        </span>
      ))}
    </sandustry-metadata-row>
  );
}
