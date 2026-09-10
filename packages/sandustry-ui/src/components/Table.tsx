import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import cx from "clsx";
import "../elements/table";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table({ className = "", children, ...props }: TableProps) {
  return (
    <sandustry-table class="block w-full overflow-x-auto">
      <table
        {...props}
        className={cx("w-full text-left font-mono text-xs border-collapse", className)}
      >
        {children}
      </table>
    </sandustry-table>
  );
}

export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHead({ className = "", ...props }: TableHeadProps) {
  return (
    <thead
      {...props}
      className={cx(
        "border-b border-[var(--sd-color-border-subtle,#242424)] text-[var(--sd-color-text-subtle,#808080)] font-mono text-xs",
        className,
      )}
    />
  );
}

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableBody({ className = "", ...props }: TableBodyProps) {
  return <tbody {...props} className={className} />;
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export function TableRow({ className = "", ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      className={cx(
        "border-b border-[var(--sd-color-border-subtle,#242424)] align-top text-[var(--sd-color-text-muted,#b6bcc1)] transition-colors",
        className,
      )}
    />
  );
}

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function TableCell({ className = "", ...props }: TableCellProps) {
  return <td {...props} className={cx("px-4 py-3", className)} />;
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TableHeaderCell({ className = "", ...props }: TableHeaderCellProps) {
  return (
    <th
      {...props}
      className={cx(
        "px-4 py-3 font-semibold text-[var(--sd-color-text,#e8eef5)] text-left",
        className,
      )}
    />
  );
}

export { TableHead as TableHeader, TableHeaderCell as TableHeadCell };
