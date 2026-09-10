import { LitElement, html, css } from "lit";

export class SandustryItemDetailPanel extends LitElement {
  static override properties = {
    title: { type: String },
    category: { type: String },
    description: { type: String },
    isEmpty: { type: Boolean, attribute: "is-empty", reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      width: 16rem;
      flex-shrink: 0;
      flex-direction: column;
      background-color: var(--sd-color-surface, rgba(0, 0, 0, 0.75));
      padding: 1rem;
      color: var(--sd-color-text, #ffffff);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-width: 1px;
      border-style: solid;
      border-color: var(--sd-color-border-subtle, #1e293b);
      border-radius: 0.25rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare title: string;
  declare category: string;
  declare description: string;
  declare isEmpty: boolean;

  constructor() {
    super();
    this.title = "";
    this.category = "";
    this.description = "";
    this.isEmpty = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-item-detail-panel")) {
  customElements.define("sandustry-item-detail-panel", SandustryItemDetailPanel);
}
