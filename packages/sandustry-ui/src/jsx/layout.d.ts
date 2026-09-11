import type { SDButtonProps, SDElementProps } from "./shared";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-panel": SDElementProps<{
        variant?: string;
        collapsible?: string | boolean;
        collapsed?: string | boolean;
        padded?: string | boolean;
        title?: string;
      }>;
      "sandustry-item-card": SDButtonProps<{
        selected?: string | boolean;
        disabled?: boolean;
        label?: string;
        meta?: string;
      }>;
      "sandustry-item-detail-panel": SDElementProps<{
        title?: string;
        category?: string;
        description?: string;
        isEmpty?: boolean;
        "is-empty"?: boolean | string;
      }>;
      "sandustry-building-tile": SDButtonProps<{
        selected?: string | boolean;
        disabled?: boolean;
        size?: string;
        label?: string;
        hotkey?: string;
      }>;
      "sandustry-save-slot-card": SDElementProps<{
        selected?: string | boolean;
        title?: string;
        tag?: string;
        timestamp?: string;
      }>;
      "sandustry-form-field": SDElementProps<{
        label?: string;
        hint?: string;
        error?: string;
        required?: string | boolean;
      }>;
      "sandustry-input-group": SDElementProps;
      "sandustry-fieldset": SDElementProps<{
        legend?: string;
      }>;
      "sandustry-metadata-row": SDElementProps<{
        wrap?: string | boolean;
      }>;
      "sandustry-action-bar": SDElementProps<{
        align?: string;
      }>;
      "sandustry-locked-state": SDElementProps<{
        boxed?: string | boolean;
        title?: string;
        label?: string;
      }>;
      "sandustry-tabs": SDElementProps<{
        value?: string;
      }>;
      "sandustry-tab": SDButtonProps<{
        selected?: boolean | string;
        disabled?: boolean | string;
      }>;
      "sandustry-mode-tabs": SDElementProps<{
        value?: string;
      }>;
      "sandustry-mode-tab": SDButtonProps<{
        selected?: boolean | string;
        disabled?: boolean | string;
        hotkey?: string;
      }>;
      "sandustry-category-list": SDElementProps<{
        bordered?: boolean | string;
      }>;
      "sandustry-category-button": SDButtonProps<{
        selected?: boolean | string;
        disabled?: boolean | string;
        label?: string;
      }>;
      "sandustry-list": SDElementProps<{
        variant?: string;
      }>;
      "sandustry-list-item": SDButtonProps<{
        selected?: boolean | string;
        disabled?: boolean | string;
        variant?: string;
      }>;
      "sandustry-progress-list": SDElementProps<{
        height?: string;
      }>;
      "sandustry-progress-list-item": SDElementProps<{
        variant?: string;
        last?: boolean | string;
      }>;
      "sandustry-table": SDElementProps;
      "sandustry-split-pane": SDElementProps<{
        sidebarPosition?: string;
        "sidebar-position"?: string;
      }>;
      "sandustry-resizable-panel": SDElementProps<{
        sidebarPosition?: string;
        "sidebar-position"?: string;
        size?: number;
        "min-size"?: number;
        "max-size"?: number;
        step?: number;
        collapsible?: boolean | string;
        collapsed?: boolean | string;
        "collapse-size"?: number;
        responsive?: boolean | string;
        "stack-breakpoint"?: number;
      }>;
      "sandustry-app-shell": SDElementProps<{
        sidebarPosition?: string;
        "sidebar-position"?: string;
        responsive?: boolean | string;
        "stack-breakpoint"?: number;
        "sidebar-label"?: string;
        "main-label"?: string;
        "has-topbar"?: boolean | string;
        "has-sidebar"?: boolean | string;
        "has-footer"?: boolean | string;
        "has-overlays"?: boolean | string;
      }>;
      "sandustry-top-bar": SDElementProps<{
        sticky?: boolean | string;
        "has-leading"?: boolean | string;
        "has-center"?: boolean | string;
        "has-trailing"?: boolean | string;
        "has-mobile-menu"?: boolean | string;
      }>;
      "sandustry-sidebar": SDElementProps<{
        position?: string;
        collapsed?: boolean | string;
        label?: string;
      }>;
    }
  }
}
