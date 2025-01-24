import { LitElement, html, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('extended-anchor')
export class ExtendedAnchor extends LitElement {
  @property({ type: String }) href: string | undefined;
  @property({ type: String }) rel: string | undefined;
  @property({ type: String }) key: string | undefined;
  @property({ type: String, reflect: true }) navigateinfo: string | undefined;
  @property({ type: String, reflect: true }) navigatestate: string | undefined;
  @property({ type: Boolean, reflect: true }) reload = false;
  @property({ type: Boolean, reflect: true }) replace = false;
  @property({ type: Boolean, reflect: true }) traverse = false;
  @property({ type: String, state: true }) computedHref: string | null | undefined;

  static findClosestEntryHref(href: string, rel: string | undefined, entries: NavigationHistoryEntry[], index: number) {
    if (!Array.isArray(entries) || index < 0 || index >= entries.length || entries.length === 1) {
      return undefined;
    }

    let left = index - 1;
    let right = index + 1;
    if (rel?.includes('next')) left = 0;
    if (rel?.includes('prev')) right = entries.length;

    while (left >= 0 || right < entries.length) {
      if (left >= 0 && entries[left]?.url === href) return entries[left];
      if (right < entries.length && entries[right]?.url === href) return entries[right];

      left--;
      right++;
    }

    return undefined;
  }

  static findClosestEntry(rel: string | undefined, entries: NavigationHistoryEntry[], index: number) {
    if (!Array.isArray(entries) || index < 0 || index >= entries.length || entries.length === 1) {
      return undefined;
    }

    let left = -1;
    let right = entries.length;
    if (rel?.includes('prev')) left = index - 1;
    if (rel?.includes('next')) right = index + 1;

    while (left >= 0 || right < entries.length) {
      if (left >= 0) return entries[left];
      if (right < entries.length) return entries[right];

      left--;
      right++;
    }

    return undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    window.navigation.addEventListener('navigatesuccess', this._onNavigate);
  }
  disconnectedCallback() {
    window.navigation.removeEventListener('navigatesuccess', this._onNavigate);
    super.disconnectedCallback();
  }

  _onNavigate = () => {
    if (!this.href && this.traverse) {
      let entry;
      if (this.key)
        entry = window.navigation.entries().find(entry => entry.key === this.key);
      else if (this.rel)
        entry = ExtendedAnchor.findClosestEntry(this.rel, window.navigation.entries(), window.navigation.currentEntry?.index ?? 0);

      this.computedHref = entry?.url;
    }
  }

  handleClick(event: PointerEvent) {
    event.preventDefault();
    const a = this.renderRoot.firstElementChild as HTMLAnchorElement;

    const navigation = window.navigation;
    if (!navigation) {
      console.warn('Navigation API not supported in this browser.');
      return;
    }

    const { rel, key, reload, replace, traverse, navigateinfo: info, navigatestate: state } = this;
    const href = a.href;

    if (traverse) {
      const entries = navigation.entries();
      const entry =
        ExtendedAnchor.findClosestEntryHref(href, rel, entries, navigation.currentEntry?.index ?? 0) ??
        ExtendedAnchor.findClosestEntry(rel, entries, navigation.currentEntry?.index ?? 0);

      if (key || entry) {
        navigation.traverseTo(key || entry!.key, { info });
        return;
      }
      console.log({ key, entry });
    }
    console.log({ href, rel, state, info, traverse, replace, reload });

    if (replace) {
      href && navigation.navigate(href, { info, state, history: 'replace' });
    } else if (reload) {
      navigation.reload({ info, state });
    } else {
      href && navigation.navigate(href, { info, state });
    }
  }

  render() {
    if (this.reload)
      this.computedHref = '.';
    if (this.traverse && this.key)
      this.computedHref = window.navigation.entries().find(entry => entry.key === this.key)?.url ?? undefined;
    return html`
      <a
        href="${this.href ?? this.computedHref ?? nothing}"
        rel="${this.rel ?? nothing}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </a>
    `;
  }
}
