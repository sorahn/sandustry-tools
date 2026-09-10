import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";
import "../elements/input-group";

export type InputGroupProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function InputGroup({ className = "", children, ...props }: InputGroupProps) {
  return (
    <sandustry-input-group class={cx("flex items-center gap-2", className)} {...props}>
      {children}
    </sandustry-input-group>
  );
}
