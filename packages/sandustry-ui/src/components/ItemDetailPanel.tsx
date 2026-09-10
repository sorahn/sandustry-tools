import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import "../elements/item-detail-panel";

export type ItemDetailPanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  category?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  isEmpty?: boolean;
};

export function ItemDetailPanel({
  title,
  category,
  description,
  footer,
  emptyTitle = "Block",
  emptyDescription = "Hover over an item to see details.",
  isEmpty = false,
  className = "",
  children,
  ...props
}: ItemDetailPanelProps) {
  const isActuallyEmpty = isEmpty || (!title && !description && !children);
  const displayTitle = isActuallyEmpty ? emptyTitle : title;
  const displayDescription = isActuallyEmpty ? emptyDescription : description;

  return (
    <sandustry-item-detail-panel
      {...props}
      is-empty={isActuallyEmpty ? "" : undefined}
      class={cx(
        "flex w-64 flex-shrink-0 flex-col bg-[var(--sd-color-surface,#222222)]/90 p-4 text-[var(--sd-color-text,#e8eef5)] shadow-lg border border-[var(--sd-color-border,#2e2e2e)] rounded",
        className,
      )}
    >
      <div className="flex-grow overflow-y-auto min-h-0">
        {category ? (
          <p className="text-xs uppercase tracking-wider text-[var(--sd-color-text-subtle,#808080)] mb-1">
            {category}
          </p>
        ) : null}
        {displayTitle ? (
          <p className="mb-2 text-lg font-medium text-[var(--sd-color-text,#e8eef5)]">
            {displayTitle}
          </p>
        ) : null}
        {displayDescription ? (
          <div className="text-sm text-[var(--sd-color-text-muted,#b6bcc1)] whitespace-pre-line leading-relaxed">
            {displayDescription}
          </div>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>

      {footer ? (
        <div className="mt-auto pt-4 border-t border-[var(--sd-color-border-subtle,#242424)] shrink-0">
          {footer}
        </div>
      ) : null}
    </sandustry-item-detail-panel>
  );
}
