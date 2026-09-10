import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/locked-state";

export type LockedStateProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  title?: ReactNode;
  icon?: ReactNode;
  label?: ReactNode;
  boxed?: boolean;
};

const defaultPadlockIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-4 w-4 shrink-0 opacity-60"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function LockedState({
  title,
  icon = defaultPadlockIcon,
  label = "Coming soon",
  boxed = false,
  className = "",
  children,
  ...props
}: LockedStateProps) {
  const isBoxed = boxed || Boolean(title);

  const content = (
    <div
      aria-disabled="true"
      className={cx(
        "flex items-center justify-center gap-2 py-2 text-[var(--sd-color-text-muted,#94a3b8)]",
        !isBoxed && className,
      )}
    >
      {icon ? <span className="flex items-center justify-center">{icon}</span> : null}
      <span className="text-sm italic">{children ?? label}</span>
    </div>
  );

  if (isBoxed) {
    return (
      <sandustry-locked-state
        {...props}
        boxed=""
        class={cx(
          "relative rounded-tr-lg rounded-bl-lg border border-dashed border-[var(--sd-color-border-strong,#3d3d3d)] p-4 block",
          className,
        )}
      >
        {title ? (
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--sd-color-text-muted,#b6bcc1)]">
            {title}
          </label>
        ) : null}
        {content}
      </sandustry-locked-state>
    );
  }

  return (
    <sandustry-locked-state {...props} class={cx("block", className)}>
      {content}
    </sandustry-locked-state>
  );
}
