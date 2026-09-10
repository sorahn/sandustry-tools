import { LitElement, html, css } from "lit";

export class SandustryTable extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      overflow-x: auto;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-table")) {
  customElements.define("sandustry-table", SandustryTable);
}
