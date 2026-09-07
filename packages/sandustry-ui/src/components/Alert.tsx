import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";

export type AlertTone = "info" | "warning" | "danger" | "accent" | "neutral";

export type AlertProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    tone?: AlertTone;
    title?: ReactNode;
    icon?: ReactNode;
  }
>;

const toneClasses: Record<AlertTone, string> = {
  warning: "border-amber-700/60 bg-amber-950/30 text-amber-200",
  danger: "border-red-700/60 bg-red-950/30 text-red-200",
  info: "border-blue-700/60 bg-blue-950/30 text-blue-200",
  accent: "border-yellow-500/60 bg-yellow-950/30 text-yellow-200",
  neutral: "border-slate-800 bg-slate-900/60 text-slate-300",
};

export function Alert({
  tone = "warning",
  title,
  icon,
  className = "",
  children,
  role,
  ...props
}: AlertProps) {
  const effectiveRole = role ?? (tone === "danger" || tone === "warning" ? "alert" : "status");

  return (
    <div
      role={effectiveRole}
      {...props}
      className={cx("rounded border p-2 text-xs leading-relaxed", toneClasses[tone], className)}
    >
      {title ? (
        <div className="font-semibold mb-1 flex items-center gap-1.5">
          {icon}
          <span>{title}</span>
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
