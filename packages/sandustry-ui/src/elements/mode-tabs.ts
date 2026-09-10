import { LitElement, html, css } from "lit";

export class SandustryModeTabs extends LitElement {
  static override properties = {
    value: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare value: string;

  constructor() {
    super();
    this.value = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryModeTab extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    hotkey: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
      height: 2.5rem;
      width: 12rem;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      border-top-right-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
      border-width: 1px;
      border-style: solid;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      user-select: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: all 200ms ease-in-out;
      font-family: var(--sd-font-family, inherit);
    }

    :host([selected]) {
      border-color: #ffe700;
      color: #ffe700;
      background: linear-gradient(45deg, rgba(255, 231, 0, 0.15), transparent);
    }

    :host(:not([selected])) {
      border-color: #64748b;
      background-color: rgba(0, 0, 0, 0.25);
      color: #ffffff;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.4;
    }
  `;

  declare selected: boolean;
  declare disabled: boolean;
  declare hotkey: string;

  constructor() {
    super();
    this.selected = false;
    this.disabled = false;
    this.hotkey = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-mode-tabs")) {
  customElements.define("sandustry-mode-tabs", SandustryModeTabs);
}

if (!customElements.get("sandustry-mode-tab")) {
  customElements.define("sandustry-mode-tab", SandustryModeTab);
}
