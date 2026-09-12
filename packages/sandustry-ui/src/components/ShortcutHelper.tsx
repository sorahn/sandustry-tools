import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import "../elements/shortcut-helper";

export type ShortcutHelperProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

/** A compact vertical list of contextual game instructions. */
export function ShortcutHelper({ children, className = "", ...props }: ShortcutHelperProps) {
  return (
    <sandustry-shortcut-helper {...props} class={className}>
      {children}
    </sandustry-shortcut-helper>
  );
}

export type ShortcutHelperItemProps = {
  hotkey: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
};

/** One key/action instruction inside `ShortcutHelper`. */
export function ShortcutHelperItem({
  hotkey,
  label,
  hint,
  className = "",
}: ShortcutHelperItemProps) {
  return (
    <sandustry-shortcut-helper-item class={className}>
      <span slot="hotkeys">{hotkey}</span>
      <span slot="label">{label}</span>
      {hint ? (
        <span
          slot="hint"
          className="ml-1.5 rounded border border-white/20 bg-black/20 px-1 text-[10px] uppercase tracking-wider opacity-75"
        >
          {hint}
        </span>
      ) : null}
    </sandustry-shortcut-helper-item>
  );
}
