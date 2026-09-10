import { LitElement, html, css } from "lit";

export class SandustrySaveSlotCard extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    title: { type: String },
    tag: { type: String },
    timestamp: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      border-radius: 0.5rem;
      box-sizing: border-box;
      user-select: none;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare selected: boolean;
  declare title: string;
  declare tag: string;
  declare timestamp: string;

  constructor() {
    super();
    this.selected = false;
    this.title = "";
    this.tag = "";
    this.timestamp = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-save-slot-card")) {
  customElements.define("sandustry-save-slot-card", SandustrySaveSlotCard);
}
