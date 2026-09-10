import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import "../elements/modal-footer-tip";

export type ModalFooterTipProps = HTMLAttributes<HTMLDivElement> & {
  tip?: ReactNode;
  action?: ReactNode;
};

export function ModalFooterTip({
  tip,
  action,
  className = "",
  children,
  ...props
}: ModalFooterTipProps) {
  return (
    <sandustry-modal-footer-tip class="block">
      <footer
        className={cx("flex items-end justify-between gap-8 mt-4 shrink-0 select-none", className)}
        {...props}
      >
        <div className="flex flex-col justify-end">
          {tip ? (
            <div className="text-[var(--sd-color-text-muted,#b6bcc1)] text-sm italic">{tip}</div>
          ) : null}
        </div>

        <div className="flex flex-col items-end">{action || children}</div>
      </footer>
    </sandustry-modal-footer-tip>
  );
}
