import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustrySwitch extends LitElement {
  static override properties = {
    label: { type: String },
    size: { type: String, reflect: true },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--sd-color-text, #cbd5e1);
      font-family: var(--sd-font-family, inherit);
      box-sizing: border-box;
      user-select: none;
    }

    :host([size="small"]) {
      font-size: 11px;
    }

    :host([size="default"]),
    :host(:not([size])) {
      font-size: 0.75rem;
    }

    :host([size="large"]) {
      font-size: 0.875rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .track {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      border-radius: 9999px;
      background-color: var(--sd-color-bg, #000000);
      box-shadow: inset 0 0 0 1px var(--sd-color-border, #334155);
      transition:
        background-color 200ms ease-in-out,
        box-shadow 200ms ease-in-out;
      box-sizing: border-box;
    }

    :host([checked]) .track {
      background-color: var(--sd-color-primary, #ffe700);
      box-shadow: inset 0 0 0 1px var(--sd-color-primary, #ffe700);
    }

    .thumb {
      position: absolute;
      border-radius: 9999px;
      background-color: var(--sd-color-border-strong, #64748b);
      transition:
        transform 200ms ease-in-out,
        background-color 200ms ease-in-out;
    }

    :host([checked]) .thumb {
      background-color: var(--sd-color-primary-foreground, #000000);
    }

    /* small */
    :host([size="small"]) .track {
      width: 1.75rem;
      height: 1rem;
    }
    :host([size="small"]) .thumb {
      top: 2px;
      left: 2px;
      width: 0.75rem;
      height: 0.75rem;
    }
    :host([size="small"][checked]) .thumb {
      transform: translateX(12px);
    }

    /* default */
    :host([size="default"]) .track,
    :host(:not([size])) .track {
      width: 2.5rem;
      height: 22px;
    }
    :host([size="default"]) .thumb,
    :host(:not([size])) .thumb {
      top: 3px;
      left: 3px;
      width: 1rem;
      height: 1rem;
    }
    :host([size="default"][checked]) .thumb,
    :host(:not([size])[checked]) .thumb {
      transform: translateX(18px);
    }

    /* large */
    :host([size="large"]) .track {
      width: 3rem;
      height: 1.75rem;
    }
    :host([size="large"]) .thumb {
      top: 3px;
      left: 3px;
      width: 1.375rem;
      height: 1.375rem;
    }
    :host([size="large"][checked]) .thumb {
      transform: translateX(20px);
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare label: string;
  declare size: ControlSize;
  declare checked: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.label = "";
    this.size = "default";
    this.checked = false;
    this.disabled = false;
  }

  private _handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.checked = target.checked;
  }

  override render() {
    return html`
      <slot>
        <label class="track" part="track">
          <input
            type="checkbox"
            class="sr-only"
            part="input"
            ?checked="${this.checked}"
            ?disabled="${this.disabled}"
            @change="${this._handleChange}"
          />
          <span class="thumb" part="thumb"></span>
        </label>
      </slot>
      <slot name="label">${this.label ? html`<span>${this.label}</span>` : ""}</slot>
    `;
  }
}

if (!customElements.get("sandustry-switch")) {
  customElements.define("sandustry-switch", SandustrySwitch);
}
