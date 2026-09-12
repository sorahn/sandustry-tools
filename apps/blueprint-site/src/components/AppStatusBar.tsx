import type { ReactNode } from "react";
import cx from "clsx";

export type AppStatusBarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function AppStatusBar({ left, center, right, className }: AppStatusBarProps) {
  return (
    <footer
      role="status"
      aria-label="Application status"
      className={cx(
        "flex h-7 shrink-0 items-center justify-between gap-4 border-t border-[var(--sd-color-border,#2a323d)]/80 bg-[var(--sd-color-surface-muted,#141414)]/90 px-3 font-mono text-[11px] text-[var(--sd-color-text-muted,#b6bcc1)] backdrop-blur-sm select-none z-20",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 truncate">{left}</div>

      {center ? <div className="hidden shrink-0 items-center gap-3 md:flex">{center}</div> : null}

      <div className="flex shrink-0 items-center gap-3 text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
        {right ?? (
          <>
            <span className="hidden sm:inline">SANDUSTRY / TOOLS</span>
            {__GIT_INFO__.commit ? (
              <a
                href="https://github.com/sorahn/sandustry-tools/"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-primary,#ffe700)]"
              >
                {__GIT_INFO__.label}
              </a>
            ) : (
              <span>{__GIT_INFO__.label}</span>
            )}
            <span className="hidden lg:inline text-[var(--sd-color-border,#2a323d)]">|</span>
            <a
              href="https://sandustryvault.com"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline hover:text-[var(--sd-color-primary,#ffe700)]"
            >
              Vault
            </a>
          </>
        )}
      </div>
    </footer>
  );
}
