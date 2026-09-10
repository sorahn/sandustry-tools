import { LitElement, html, css } from "lit";

export class SandustryItemCard extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    meta: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    .card {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.5rem;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      border-color: #334155;
      background-color: rgba(0, 0, 0, 0.4);
      padding: 0.375rem 0.5rem;
      text-align: left;
      transition: all 200ms ease-in-out;
      color: inherit;
      background: none;
      cursor: pointer;
      box-sizing: border-box;
    }

    :host([selected]) .card {
      border-color: #ffe700;
      background-color: rgba(255, 231, 0, 0.1);
    }

    :host(:not([selected])) .card:hover {
      border-color: #64748b;
      background-color: rgba(0, 0, 0, 0.6);
    }

    :host([disabled]) .card {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare selected: boolean;
  declare disabled: boolean;
  declare label: string;
  declare meta: string;

  constructor() {
    super();
    this.selected = false;
    this.disabled = false;
    this.label = "";
    this.meta = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-item-card")) {
  customElements.define("sandustry-item-card", SandustryItemCard);
}
