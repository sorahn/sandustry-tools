import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import cx from "clsx";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <table
      {...props}
      className={cx("w-full text-left font-mono text-xs border-collapse", className)}
    />
  );
}

export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHead({ className = "", ...props }: TableHeadProps) {
  return (
    <thead
      {...props}
      className={cx("border-b border-slate-800 text-slate-500 font-mono text-xs", className)}
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
        "border-b border-slate-900 align-top text-slate-300 transition-colors",
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
    <th {...props} className={cx("px-4 py-3 font-semibold text-slate-400 text-left", className)} />
  );
}

export { TableHead as TableHeader, TableHeaderCell as TableHeadCell };
