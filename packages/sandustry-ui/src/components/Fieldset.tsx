import type { FieldsetHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/fieldset";

export type FieldsetProps = PropsWithChildren<FieldsetHTMLAttributes<HTMLFieldSetElement>> & {
  legend?: ReactNode;
};

export function Fieldset({ legend, className = "", children, ...props }: FieldsetProps) {
  return (
    <sandustry-fieldset
      class={cx(
        "relative rounded-tr-lg rounded-bl-lg border border-dashed border-[var(--sd-color-border-strong,#3d3d3d)] p-4 block",
        className,
      )}
    >
      <fieldset {...props} className="contents">
        {legend ? (
          <legend className="mb-2 block text-xs uppercase tracking-widest text-[var(--sd-color-text-muted,#b6bcc1)]">
            {legend}
          </legend>
        ) : null}
        {children}
      </fieldset>
    </sandustry-fieldset>
  );
}
