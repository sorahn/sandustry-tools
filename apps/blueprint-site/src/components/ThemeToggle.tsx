import { useState } from "react";
import { Popover } from "@sandustry/ui";
import { THEME_OPTIONS, useTheme } from "../utils/theme";

export function ThemeToggle() {
  const [theme, setTheme, toggleMode] = useTheme();
  const [open, setOpen] = useState(false);

  const currentOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      side="bottom"
      className="w-48 overflow-hidden rounded-lg border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface-elevated,#262d37)]/95 p-1 shadow-2xl backdrop-blur-md"
      content={
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="border-b border-[var(--sd-color-border,#2a323d)] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--sd-color-text-muted,#b6bcc1)]">
            Themes
          </div>
          {THEME_OPTIONS.map((opt) => {
            const isSelected = opt.id === theme;
            return (
              <button
                key={opt.id}
                type="button"
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                  isSelected
                    ? "bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.12))] text-[var(--sd-color-primary,#ffe700)] font-bold"
                    : "text-[var(--sd-color-text,#e8eef5)] hover:bg-[var(--sd-color-surface-hover,#2f3742)] hover:text-[var(--sd-color-primary,#ffe700)]"
                }`}
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
              >
                <span className="text-sm">{opt.icon}</span>
                <span className="flex-1">{opt.name}</span>
                {isSelected ? <span className="text-[10px]">✓</span> : null}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex items-center rounded border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/60 text-xs transition-colors hover:border-[var(--sd-color-primary,#ffe700)]/60">
        <button
          type="button"
          aria-label={`Toggle theme, current is ${currentOption.name}`}
          className="flex items-center gap-1.5 px-2 py-1 text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-primary,#ffe700)] focus-visible:outline-none"
          onClick={toggleMode}
          title={`Click to switch between dark and light mode (Current: ${currentOption.name})`}
        >
          <span className="text-[13px] leading-none">{currentOption.icon}</span>
          <span className="font-mono text-[11px] hidden sm:inline">
            {theme === "terrain-light" ? "Light" : "Dark"}
          </span>
        </button>
        <button
          type="button"
          aria-label="Select theme"
          className="border-l border-[var(--sd-color-border,#2a323d)] px-1.5 py-1 text-[9px] text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-primary,#ffe700)]"
          onClick={() => setOpen((prev) => !prev)}
          title="Open theme menu"
        >
          ▾
        </button>
      </div>
    </Popover>
  );
}
