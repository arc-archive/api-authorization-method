import { html } from 'lit-element';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@api-components/api-navigation/api-navigation.js';
import '../api-authorization-method.js';

class DemoPage extends ApiDemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'demoState',
      'compatibility',
      'outlined',
      'mainChangesCounter',
      'basicChangesCounter',
      'ntlmChangesCounter',
      'digestChangesCounter',
      'oauth1ChangesCounter',
      'oauth2ChangesCounter',
      'security',
    ]);
    this.componentName = 'api-authorization-method';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.demoState = 0;
    this.mainChangesCounter = 0;
    this.basicChangesCounter = 0;
    this.ntlmChangesCounter = 0;
    this.digestChangesCounter = 0;
    this.oauth1ChangesCounter = 0;
    this.oauth2ChangesCounter = 0;
    this.oauth2redirect = 'http://auth.advancedrestclient.com/arc.html';
    this.oauth2scopes = [
      'profile',
      'email'
    ];
    this.authorizationUri = `${location.protocol}//${location.host}${location.pathname}oauth-authorize.html`;

    this._mainChangeHandler = this._mainChangeHandler.bind(this);
    this._basicChangeHandler = this._basicChangeHandler.bind(this);
    this._ntlmChangeHandler = this._ntlmChangeHandler.bind(this);
    this._digestChangeHandler = this._digestChangeHandler.bind(this);
    this._oauth1ChangeHandler = this._oauth1ChangeHandler.bind(this);
    this._oauth2ChangeHandler = this._oauth2ChangeHandler.bind(this);

    window.addEventListener('oauth1-token-requested', this._oauth1TokenHandler.bind(this));
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.demoState = state;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
  }

  get type() {
    const { securityType } = this;
    switch (securityType) {
      case 'Basic Authentication':
      case 'basic':
        return 'basic';
      case 'Digest Authentication': return 'digest';
      case 'Pass Through': return 'pass through';
      case 'OAuth 2.0': return 'oauth 2';
      case 'OAuth 1.0': return 'oauth 1';
      case 'Api Key': return 'api key';
      case 'bearer': return 'bearer';
      default:
        if (String(securityType).indexOf('x-') === 0) {
          return 'custom';
        }
        return null;
    }
  }

  _navChanged(e) {
    const { selected, type } = e.detail;
    this.mainChangesCounter = 0;
    if (type === 'method') {
      this.setData(selected);
      this.hasData = true;
    } else {
      this.hasData = false;
    }
  }

  setData(selected) {
    const sec = this.ns.aml.vocabularies.security;
    const webApi = this._computeWebApi(this.amf);
    const method = this._computeMethodModel(webApi, selected);
    const key = this._getAmfKey(sec.security);
    const shKey = this._getAmfKey(sec.scheme);
    const schemesKey = this._getAmfKey(sec.schemes);
    const security = this._ensureArray(method[key]);
    let auth;
    let type;
    for (let i = 0, len = security.length; i < len; i++) {
      const securityRequirement = security[i];
      const schemes = securityRequirement[schemesKey];
      if (!schemes) {
        continue;
      }
      const requirement = schemes[0];
      let scheme = requirement[shKey];
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      auth = requirement;
      type = this._getValue(scheme, sec.type);
      if (type === 'Api Key') {
        auth = schemes;
      } else if (type === 'http') {
        const settingsKey = this._getAmfKey(sec.settings);
        const settings = this._ensureArray(scheme[settingsKey])[0];
        type = this._getValue(settings, sec.scheme);
      }
      break;
    }
    this.security = auth;
    this.securityType = type;
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'Demo API'],
      ['api-keys', 'API key'],
      ['oauth-flows', 'OAS OAuth Flow'],
      ['oas-bearer', 'OAS Bearer'],
    ].map(([file, label]) => html`
      <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
      <anypoint-item data-src="${file}.json">${label}</anypoint-item>
      `);
  }

  _mainChangeHandler(e) {
    this.mainChangesCounter++;
    const data = e.target.serialize();
    console.log(data);
  }

  _basicChangeHandler() {
    this.basicChangesCounter++;
  }

  _ntlmChangeHandler() {
    this.ntlmChangesCounter++;
  }

  _digestChangeHandler() {
    this.digestChangesCounter++;
  }

  _oauth1ChangeHandler() {
    this.oauth1ChangesCounter++;
  }

  _oauth2ChangeHandler() {
    this.oauth2ChangesCounter++;
  }

  _oauth1TokenHandler(e) {
    e.preventDefault();
    setTimeout(() => this._dispatchOauth1Token(), 1000);
  }

  _dispatchOauth1Token() {
    const e = new CustomEvent('oauth1-token-response', {
      bubbles: true,
      detail: {
        oauth_token: 'dummy-token',
        oauth_token_secret: 'dummy-secret',
      }
    });
    document.body.dispatchEvent(e);
  }

  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      compatibility,
      outlined,
      type,
      security,
      amf,
      mainChangesCounter,
      demoState,
    } = this;
    return html`
      <section class="documentation-section">
        <h3>Interactive demo</h3>
        <p>
          This demo lets you preview the API authorization method element with various
          configuration options.
        </p>
        <arc-interactive-demo
          .states="${demoStates}"
          .selectedState="${demoState}"
          @state-chanegd="${this._demoStateHandler}"
          ?dark="${darkThemeActive}"
        >

          <api-authorization-method
            ?compatibility="${compatibility}"
            ?outlined="${outlined}"
            type="${type}"
            .security="${security}"
            .amf="${amf}"
            slot="content"
            @change="${this._mainChangeHandler}"
          ></api-authorization-method>
        </arc-interactive-demo>
        <p>Change events counter: ${mainChangesCounter}</p>
      </section>
    `;
  }

  contentTemplate() {
    return html`
      <oauth2-authorization></oauth2-authorization>
      <h2>API authorization method</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
