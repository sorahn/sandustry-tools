import { LitElement, html, css } from "lit";

export class SandustryBuildingTile extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String },
    hotkey: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      user-select: none;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([size="sm"]) {
      width: 3.5rem;
    }

    :host([size="md"]),
    :host(:not([size])) {
      width: 4rem;
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  `;

  declare selected: boolean;
  declare disabled: boolean;
  declare size: "md" | "sm";
  declare label: string;
  declare hotkey: string;

  constructor() {
    super();
    this.selected = false;
    this.disabled = false;
    this.size = "md";
    this.label = "";
    this.hotkey = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-building-tile")) {
  customElements.define("sandustry-building-tile", SandustryBuildingTile);
}
