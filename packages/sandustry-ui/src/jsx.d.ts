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
    }
  }
}
