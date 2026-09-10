import { LitElement, html, css } from "lit";

export class SandustrySplitPane extends LitElement {
  static override properties = {
    sidebarPosition: { type: String, attribute: "sidebar-position", reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare sidebarPosition: "start" | "end";

  constructor() {
    super();
    this.sidebarPosition = "start";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-split-pane")) {
  customElements.define("sandustry-split-pane", SandustrySplitPane);
}
