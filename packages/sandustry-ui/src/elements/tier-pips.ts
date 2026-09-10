import { LitElement, html, css } from "lit";

export class SandustryTierPips extends LitElement {
  static override properties = {
    current: { type: Number },
    max: { type: Number },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      background-color: var(--sd-color-surface, rgba(0, 0, 0, 0.75));
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      border: 1px solid var(--sd-color-border-subtle, #1e293b);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    .pip {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      margin-left: 1px;
      margin-right: 1px;
      transition:
        background-color 150ms ease,
        box-shadow 150ms ease;
    }

    .pip--active {
      background-color: var(--sd-color-success, #4ade80);
      box-shadow: 0 0 4px var(--sd-color-success, rgba(74, 222, 128, 0.8));
    }

    .pip--inactive {
      background-color: var(--sd-color-border, #374151);
    }
  `;

  declare current: number;
  declare max: number;

  constructor() {
    super();
    this.current = 0;
    this.max = 5;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "progressbar");
    }
  }

  override willUpdate() {
    const clampedCurrent = Math.max(0, Math.min(this.current, this.max));
    this.setAttribute("aria-valuenow", String(clampedCurrent));
    this.setAttribute("aria-valuemin", "0");
    this.setAttribute("aria-valuemax", String(this.max));
  }

  override render() {
    const clampedCurrent = Math.max(0, Math.min(this.current, this.max));
    const pips = Array.from({ length: this.max }, (_, i) => i < clampedCurrent);

    return html`
      ${pips.map(
        (active) => html`
          <span class="pip ${active ? "pip--active" : "pip--inactive"}" part="pip"></span>
        `,
      )}
    `;
  }
}

if (!customElements.get("sandustry-tier-pips")) {
  customElements.define("sandustry-tier-pips", SandustryTierPips);
}
