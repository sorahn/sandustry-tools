import { LitElement, html, css } from "lit";

export class SandustryTabs extends LitElement {
  static override properties = {
    value: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--sd-color-border, rgba(51, 65, 85, 0.6));
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

export class SandustryTab extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    button {
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0 0.5rem 0.5rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--sd-color-text, #cbd5e1);
      cursor: pointer;
      outline: none;
      transition:
        color 150ms ease-in-out,
        border-color 150ms ease-in-out;
      font-family: inherit;
    }

    button:hover:not(:disabled) {
      border-color: var(--sd-color-border-strong, #64748b);
      color: var(--sd-color-text, #ffffff);
    }

    :host([selected]) button {
      border-color: var(--sd-color-primary, #ffe700);
      color: var(--sd-color-primary, #ffe700);
    }

    :host([disabled]) button {
      cursor: not-allowed;
      opacity: 0.4;
      color: var(--sd-color-text-subtle, #cbd5e1);
      border-color: transparent;
    }
  `;

  declare selected: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.selected = false;
    this.disabled = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-tabs")) {
  customElements.define("sandustry-tabs", SandustryTabs);
}

if (!customElements.get("sandustry-tab")) {
  customElements.define("sandustry-tab", SandustryTab);
}
