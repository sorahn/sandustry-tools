import type { TextareaHTMLAttributes } from "react";
import cx from "clsx";
import "../elements/text-area";

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <sandustry-text-area class="block w-full">
      <textarea
        className={cx(
          "min-h-80 w-full resize-y rounded border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface,#181c20)] p-3 font-mono text-xs leading-6 text-[var(--sd-color-text,#e8eef5)] placeholder:text-[var(--sd-color-text-subtle,#808080)] focus:border-[var(--sd-color-border-strong,#64748b)] focus:outline-2 focus:outline-[var(--sd-color-primary,#ffe700)] focus:outline-offset-2",
          className,
        )}
        {...props}
      />
    </sandustry-text-area>
  );
}
