import type * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-status-indicator": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        tone?: string;
        label?: string;
        value?: string;
        class?: string;
      };
      "sandustry-badge": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        tone?: string;
        shape?: string;
        class?: string;
      };
      "sandustry-divider": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: string;
        class?: string;
      };
      "sandustry-keycap": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: string;
        size?: string;
        class?: string;
      };
      "sandustry-tier-pips": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        current?: number;
        max?: number;
        class?: string;
      };
      "sandustry-spinner": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        size?: string;
        tone?: string;
        label?: string;
        class?: string;
      };
      "sandustry-property-tile": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        subValue?: string;
        class?: string;
      };
      "sandustry-alert": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        tone?: string;
        title?: string;
        class?: string;
      };
      "sandustry-button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: string;
        size?: string;
        noShift?: string | boolean;
        "no-shift"?: string | boolean;
        href?: string;
        target?: string;
        class?: string;
      };
      "sandustry-icon-button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        size?: string;
        class?: string;
      };
      "sandustry-text-action": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        href?: string;
        class?: string;
      };
      "sandustry-text-input": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        tone?: string;
        monospace?: string | boolean;
        scale?: string;
        placeholder?: string;
        value?: string;
        class?: string;
      };
      "sandustry-text-area": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        placeholder?: string;
        value?: string;
        class?: string;
      };
      "sandustry-search-input": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        scale?: string;
        placeholder?: string;
        value?: string;
        class?: string;
      };
      "sandustry-checkbox": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        boxed?: string | boolean;
        size?: string;
        label?: string;
        checked?: boolean;
        class?: string;
      };
      "sandustry-switch": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        size?: string;
        checked?: boolean;
        class?: string;
      };
      "sandustry-slider": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        showValue?: boolean | string;
        "show-value"?: boolean | string;
        size?: string;
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        class?: string;
      };
      "sandustry-segmented-control": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        size?: string;
        value?: string;
        class?: string;
      };
      "sandustry-panel": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: string;
        collapsible?: string | boolean;
        collapsed?: string | boolean;
        padded?: string | boolean;
        title?: string;
        class?: string;
      };
      "sandustry-item-card": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: string | boolean;
        disabled?: boolean;
        label?: string;
        meta?: string;
        class?: string;
      };
      "sandustry-item-detail-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        title?: string;
        category?: string;
        description?: string;
        isEmpty?: boolean;
        "is-empty"?: boolean | string;
        class?: string;
      };
      "sandustry-building-tile": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: string | boolean;
        disabled?: boolean;
        size?: string;
        label?: string;
        hotkey?: string;
        class?: string;
      };
      "sandustry-save-slot-card": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: string | boolean;
        title?: string;
        tag?: string;
        timestamp?: string;
        class?: string;
      };
      "sandustry-form-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        hint?: string;
        error?: string;
        required?: string | boolean;
        class?: string;
      };
      "sandustry-input-group": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      "sandustry-fieldset": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        legend?: string;
        class?: string;
      };
      "sandustry-metadata-row": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        wrap?: string | boolean;
        class?: string;
      };
      "sandustry-action-bar": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        align?: string;
        class?: string;
      };
      "sandustry-locked-state": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        boxed?: string | boolean;
        title?: string;
        label?: string;
        class?: string;
      };
      "sandustry-tabs": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        class?: string;
      };
      "sandustry-tab": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: boolean | string;
        disabled?: boolean | string;
        class?: string;
      };
      "sandustry-mode-tabs": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: string;
        class?: string;
      };
      "sandustry-mode-tab": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: boolean | string;
        disabled?: boolean | string;
        hotkey?: string;
        class?: string;
      };
      "sandustry-category-list": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        bordered?: boolean | string;
        class?: string;
      };
      "sandustry-category-button": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: boolean | string;
        disabled?: boolean | string;
        label?: string;
        class?: string;
      };
      "sandustry-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: string;
        class?: string;
      };
      "sandustry-list-item": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: boolean | string;
        disabled?: boolean | string;
        variant?: string;
        class?: string;
      };
      "sandustry-progress-list": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        height?: string;
        class?: string;
      };
      "sandustry-progress-list-item": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: string;
        last?: boolean | string;
        class?: string;
      };
      "sandustry-table": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
      };
      "sandustry-split-pane": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        sidebarPosition?: string;
        "sidebar-position"?: string;
        class?: string;
      };
      "sandustry-resizable-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        class?: string;
      };
      "sandustry-app-shell": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
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
        class?: string;
      };
      "sandustry-collapsible": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        open?: boolean | string;
        collapsible?: boolean | string;
        title?: string;
        class?: string;
      };
      "sandustry-dialog": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        open?: boolean | string;
        title?: string;
        class?: string;
      };
      "sandustry-popover": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        open?: boolean | string;
        side?: string;
        class?: string;
      };
      "sandustry-tooltip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        side?: string;
        class?: string;
      };
      "sandustry-tooltip-surface": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      "sandustry-toast": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: string;
        title?: string;
        class?: string;
      };
      "sandustry-toast-container": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      "sandustry-loading-overlay": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        busy?: boolean | string;
        visible?: boolean | string;
        class?: string;
      };
      "sandustry-file-dropzone": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        dragging?: boolean | string;
        disabled?: boolean | string;
        accept?: string;
        multiple?: boolean | string;
        class?: string;
      };
      "sandustry-color-picker": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: string | null;
        class?: string;
      };
      "sandustry-element-picker": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: string;
        query?: string;
        matter?: string;
        class?: string;
      };
      "sandustry-filter-overlay": React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        status?: string;
        class?: string;
      };
      "sandustry-modal-footer-tip": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
      "sandustry-progress-bar": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: number;
        max?: number;
        tone?: string;
        class?: string;
      };
      "sandustry-select": React.DetailedHTMLProps<
        React.SelectHTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        scale?: string;
        class?: string;
      };
      "sandustry-resource-amount": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        type?: string;
        amount?: string | number;
        size?: string;
        class?: string;
      };
      "sandustry-currency-row": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        size?: string;
        class?: string;
      };
      "sandustry-hotbar": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selectedId?: string;
        "selected-id"?: string;
        class?: string;
      };
      "sandustry-hotbar-stepper": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
      };
    }
  }
}
