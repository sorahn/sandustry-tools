import { LitElement, html, css } from "lit";

export type PanelVariant = "default" | "hero";

export class SandustryPanel extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    collapsible: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    padded: { type: Boolean, reflect: true },
    title: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      overflow: hidden;
      border-width: 1px;
      border-style: solid;
      border-color: var(--sd-color-border, #334155);
      background-color: var(--sd-color-surface, rgba(0, 0, 0, 0.75));
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 0.25rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([variant="hero"]) {
      border-top-right-radius: 12px;
      border-bottom-left-radius: 12px;
      border-top-left-radius: 0;
      border-bottom-right-radius: 0;
      border-color: var(--sd-color-border-strong, rgba(100, 116, 139, 0.7));
      background-color: var(--sd-color-surface, rgba(0, 0, 0, 0.92));
      box-shadow: 0 28px 64px rgba(0, 0, 0, 0.56);
      outline: 1px solid var(--sd-color-bg, #000000);
    }

    :host([padded]) .content {
      padding: 1rem;
    }
  `;

  declare variant: PanelVariant;
  declare collapsible: boolean;
  declare collapsed: boolean;
  declare padded: boolean;
  declare title: string;

  constructor() {
    super();
    this.variant = "default";
    this.collapsible = false;
    this.collapsed = false;
    this.padded = false;
    this.title = "";
  }

  override render() {
    return html`
      <slot name="header"></slot>
      <div class="content" part="content">
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get("sandustry-panel")) {
  customElements.define("sandustry-panel", SandustryPanel);
}
