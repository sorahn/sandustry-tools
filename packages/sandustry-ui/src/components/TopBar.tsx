import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import type {} from "../jsx";
import "../elements/top-bar";

export type TopBarProps = PropsWithChildren<HTMLAttributes<HTMLElement>> & {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
  mobileMenu?: ReactNode;
  sticky?: boolean;
};

export function TopBar({
  leading,
  center,
  trailing,
  mobileMenu,
  sticky = false,
  className = "",
  children,
  ...props
}: TopBarProps) {
  return (
    <sandustry-top-bar
      {...props}
      sticky={sticky ? "" : undefined}
      has-leading={leading ? "" : undefined}
      has-center={center || children ? "" : undefined}
      has-trailing={trailing ? "" : undefined}
      has-mobile-menu={mobileMenu ? "" : undefined}
      class={cx(
        "border-b border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface,rgba(0,0,0,0.75))] px-4 text-[var(--sd-color-text,#e8eef5)]",
        className,
      )}
    >
      {mobileMenu ? <div slot="mobile-menu">{mobileMenu}</div> : null}
      {leading ? <div slot="leading">{leading}</div> : null}
      {center || children ? <div slot="center">{center ?? children}</div> : null}
      {trailing ? <div slot="trailing">{trailing}</div> : null}
    </sandustry-top-bar>
  );
}
