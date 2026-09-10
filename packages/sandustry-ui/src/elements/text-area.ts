import { LitElement, html, css } from "lit";

export class SandustryTextArea extends LitElement {
  static override properties = {
    placeholder: { type: String },
    value: { type: String },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .textarea {
      min-height: 20rem;
      width: 100%;
      resize: vertical;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      border-color: #334155;
      background-color: rgba(0, 0, 0, 0.7);
      padding: 0.75rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.75rem;
      line-height: 1.5rem;
      color: #e2e8f0;
      box-sizing: border-box;
      outline: none;
    }

    .textarea::placeholder {
      color: #475569;
    }

    .textarea:focus {
      border-color: #64748b;
      outline: 2px solid #fde047;
      outline-offset: 2px;
    }

    :host([disabled]) .textarea {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare placeholder: string;
  declare value: string;
  declare disabled: boolean;
  declare readonly: boolean;

  constructor() {
    super();
    this.placeholder = "";
    this.value = "";
    this.disabled = false;
    this.readonly = false;
  }

  private _handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
  }

  override render() {
    return html`<slot>
      <textarea
        part="textarea"
        class="textarea"
        placeholder="${this.placeholder}"
        ?disabled="${this.disabled}"
        ?readonly="${this.readonly}"
        @input="${this._handleInput}"
      >
${this.value}</textarea>
    </slot>`;
  }
}

if (!customElements.get("sandustry-text-area")) {
  customElements.define("sandustry-text-area", SandustryTextArea);
}
