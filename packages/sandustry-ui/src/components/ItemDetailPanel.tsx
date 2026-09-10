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
        "flex w-64 flex-shrink-0 flex-col bg-black/75 p-4 text-white shadow-lg border border-slate-800 rounded",
        className,
      )}
    >
      <div className="flex-grow overflow-y-auto min-h-0">
        {category ? (
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{category}</p>
        ) : null}
        {displayTitle ? (
          <p className="mb-2 text-lg font-medium text-white">{displayTitle}</p>
        ) : null}
        {displayDescription ? (
          <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {displayDescription}
          </div>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>

      {footer ? (
        <div className="mt-auto pt-4 border-t border-slate-800 shrink-0">{footer}</div>
      ) : null}
    </sandustry-item-detail-panel>
  );
}
