import { LitElement, html, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('navigation-entries')
class NavigationEntries extends LitElement {
  @property({ type: String, state: true }) entries: NavigationHistoryEntry[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.entries = window.navigation.entries();
    window.navigation.addEventListener('navigatesuccess', this._onNavigate);
  }
  disconnectedCallback() {
    window.navigation.removeEventListener('navigatesuccess', this._onNavigate);
    super.disconnectedCallback();
  }

  _onNavigate = () => {
    this.entries = window.navigation.entries();
  }

  render() {
    return html`
      <ol start=0>
        ${this.entries.map(entry => {
          return html`
            <li>
              <extended-anchor key="${entry.key}" traverse>${entry.url}</extended-anchor>
            </li>
          `;
        })}
      </ol>
    `;
  }
}
