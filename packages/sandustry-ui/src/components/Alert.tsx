import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/alert";

export type { AlertTone } from "../elements/alert";
import type { AlertTone } from "../elements/alert";

export type AlertProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLElement>, "title"> & {
    tone?: AlertTone;
    title?: ReactNode;
    icon?: ReactNode;
  }
>;

const toneClasses: Record<AlertTone, string> = {
  warning:
    "border-[var(--sd-color-warning-border,rgba(180,83,9,0.6))] bg-[var(--sd-color-warning-soft,rgba(69,26,3,0.3))] text-[var(--sd-color-warning,#ffa500)]",
  danger:
    "border-[var(--sd-color-danger-border,rgba(185,28,28,0.6))] bg-[var(--sd-color-danger-soft,rgba(69,10,10,0.3))] text-[var(--sd-color-danger,#ff3300)]",
  info: "border-[var(--sd-color-info-border,rgba(29,78,216,0.6))] bg-[var(--sd-color-info-soft,rgba(23,37,84,0.3))] text-[var(--sd-color-info,#38bdf8)]",
  accent:
    "border-[var(--sd-color-primary-glow,rgba(234,179,8,0.6))] bg-[var(--sd-color-primary-soft,rgba(113,63,18,0.3))] text-[var(--sd-color-primary,#ffe700)]",
  neutral:
    "border-[var(--sd-color-border-subtle,#1e293b)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] text-[var(--sd-color-text-muted,#94a3b8)]",
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
  const isStringTitle = typeof title === "string";

  return (
    <sandustry-alert
      role={effectiveRole}
      tone={tone}
      title={isStringTitle ? title : undefined}
      {...props}
      class={cx("block rounded border p-2 text-xs leading-relaxed", toneClasses[tone], className)}
    >
      {title ? (
        <div className="font-semibold mb-1 flex items-center gap-1.5">
          {icon}
          <span>{title}</span>
        </div>
      ) : null}
      <div>{children}</div>
    </sandustry-alert>
  );
}
