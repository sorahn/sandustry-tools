import type { LabelHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/form-field";

export type FormFieldProps = PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
};

export function FormField({
  label,
  hint,
  error,
  required = false,
  className = "",
  children,
  ...props
}: FormFieldProps) {
  return (
    <sandustry-form-field required={required ? "" : undefined} class={cx("block", className)}>
      <label {...props} className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--sd-color-text,#ffffff)]">
          {label}
          {required ? (
            <span className="ml-1 text-[var(--sd-color-primary,#ffe700)]" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {children}
        {error ? (
          <span className="mt-1.5 block text-xs text-[var(--sd-color-danger,#ff3300)]" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span className="mt-1.5 block text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
            {hint}
          </span>
        ) : null}
      </label>
    </sandustry-form-field>
  );
}
