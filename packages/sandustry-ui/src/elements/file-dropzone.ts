import { LitElement, html, css } from "lit";

export class SandustryFileDropZone extends LitElement {
  static override properties = {
    dragging: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    accept: { type: String },
    multiple: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare dragging: boolean;
  declare disabled: boolean;
  declare accept: string;
  declare multiple: boolean;

  constructor() {
    super();
    this.dragging = false;
    this.disabled = false;
    this.accept = "";
    this.multiple = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-file-dropzone")) {
  customElements.define("sandustry-file-dropzone", SandustryFileDropZone);
}
