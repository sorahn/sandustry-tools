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
  warning: "border-amber-700/60 bg-amber-950/30 text-amber-200",
  danger: "border-red-700/60 bg-red-950/30 text-red-200",
  info: "border-blue-700/60 bg-blue-950/30 text-blue-200",
  accent: "border-yellow-500/60 bg-yellow-950/30 text-yellow-200",
  neutral:
    "border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] text-[var(--sd-color-text-muted,#b6bcc1)]",
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
