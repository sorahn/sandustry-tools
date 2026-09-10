import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustryCheckbox extends LitElement {
  static override properties = {
    boxed: { type: Boolean, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #94a3b8;
      box-sizing: border-box;
      user-select: none;
    }

    :host([size="small"]) {
      min-height: 1.5rem;
      gap: 0.25rem;
      font-size: 10px;
    }

    :host([size="default"]),
    :host(:not([size])) {
      font-size: 11px;
    }

    :host([size="large"]) {
      min-height: 2rem;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    :host([boxed]) {
      gap: 0.625rem;
      border-top-right-radius: var(--sd-radius, 0.5rem);
      border-bottom-left-radius: var(--sd-radius, 0.5rem);
      border-width: 1px;
      border-style: solid;
      border-color: rgba(203, 213, 225, 0.25);
      background-color: #000000;
      padding: 0.25rem 0.625rem;
    }

    .checkbox {
      cursor: pointer;
      accent-color: #fde047;
      margin: 0;
    }

    :host([size="small"]) .checkbox {
      width: 0.75rem;
      height: 0.75rem;
    }

    :host([size="default"]) .checkbox,
    :host(:not([size])) .checkbox {
      width: 0.875rem;
      height: 0.875rem;
    }

    :host([size="large"]) .checkbox {
      width: 1rem;
      height: 1rem;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare boxed: boolean;
  declare size: ControlSize;
  declare label: string;
  declare checked: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.boxed = false;
    this.size = "default";
    this.label = "";
    this.checked = false;
    this.disabled = false;
  }

  private _handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.checked = target.checked;
  }

  override render() {
    return html`
      <slot name="label">${this.label ? html`<span>${this.label}</span>` : ""}</slot>
      <slot>
        <input
          part="checkbox"
          class="checkbox"
          type="checkbox"
          ?checked="${this.checked}"
          ?disabled="${this.disabled}"
          @change="${this._handleChange}"
        />
      </slot>
    `;
  }
}

if (!customElements.get("sandustry-checkbox")) {
  customElements.define("sandustry-checkbox", SandustryCheckbox);
}
