export { SandustryStatusIndicator, type StatusIndicatorTone } from "./status-indicator";
export { SandustryBadge, type BadgeTone, type BadgeShape } from "./badge";
export { SandustryDivider, type DividerVariant } from "./divider";
export { SandustryKeycap, type KeycapVariant, type KeycapSize } from "./keycap";
export { SandustryTierPips } from "./tier-pips";
export { SandustrySpinner, type SpinnerTone } from "./spinner";
export { SandustryPropertyTile } from "./property-tile";
export { SandustryAlert, type AlertTone } from "./alert";
export { SandustryButton, type ButtonVariant, type ButtonSize } from "./button";
export { SandustryIconButton } from "./icon-button";
export { SandustryTextAction } from "./text-action";
export { SandustryTextInput } from "./text-input";
export { SandustryTextArea } from "./text-area";
export { SandustrySearchInput } from "./search-input";
export { SandustryCheckbox } from "./checkbox";
export { SandustrySwitch } from "./switch";
export { SandustrySlider } from "./slider";
export { SandustrySegmentedControl, type SegmentOption } from "./segmented-control";
export { SandustryPanel, type PanelVariant } from "./panel";
export { SandustryItemCard } from "./item-card";
export { SandustryItemDetailPanel } from "./item-detail-panel";
export { SandustryBuildingTile } from "./building-tile";
export { SandustrySaveSlotCard } from "./save-slot-card";
export { SandustryFormField } from "./form-field";
export { SandustryInputGroup } from "./input-group";
export { SandustryFieldset } from "./fieldset";
export { SandustryMetadataRow } from "./metadata-row";
export { SandustryActionBar, type ActionBarAlign } from "./action-bar";
export { SandustryLockedState } from "./locked-state";

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
    }
  }
}
