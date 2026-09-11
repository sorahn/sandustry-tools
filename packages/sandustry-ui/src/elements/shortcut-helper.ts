import { LitElement, css, html } from "lit";

export class SandustryShortcutHelper extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      max-width: 100%;
    }

    .surface {
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.25rem;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      font-size: 0.875rem;
      line-height: 1.25rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
      width: max-content;
      max-width: 100%;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  `;

  override render() {
    return html`<div class="surface">
      <div class="content"><slot></slot></div>
    </div>`;
  }
}

export class SandustryShortcutHelperItem extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      pointer-events: auto;
      cursor: pointer;
      border-radius: 0.25rem;
      padding: 0 0.25rem;
      margin: 0 -0.25rem;
      transition: background-color 150ms ease;
    }

    .row:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .hotkeys {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .label {
      color: #e5e7eb;
    }
  `;

  override render() {
    return html`<div class="row">
      <div class="hotkeys"><slot name="hotkeys"></slot></div>
      <span class="label"><slot name="label"></slot></span>
      <slot name="hint"></slot>
    </div>`;
  }
}

if (!customElements.get("sandustry-shortcut-helper")) {
  customElements.define("sandustry-shortcut-helper", SandustryShortcutHelper);
}

if (!customElements.get("sandustry-shortcut-helper-item")) {
  customElements.define("sandustry-shortcut-helper-item", SandustryShortcutHelperItem);
}
