export { SandustryStatusIndicator, type StatusIndicatorTone } from "./status-indicator";
export { SandustryBadge, type BadgeTone, type BadgeShape } from "./badge";
export { SandustryDivider, type DividerVariant } from "./divider";
export { SandustryKeycap, type KeycapVariant, type KeycapSize } from "./keycap";
export { SandustryTierPips } from "./tier-pips";
export { SandustrySpinner, type SpinnerTone } from "./spinner";
export { SandustryPropertyTile } from "./property-tile";
export { SandustryAlert, type AlertTone } from "./alert";

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
    }
  }
}
