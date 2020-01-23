import { html, LitElement } from 'lit-element';
import { ApiDemoPageBase } from '@advanced-rest-client/arc-demo-helper/ApiDemoPage.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@api-components/api-navigation/api-navigation.js';
import '../api-authorization-method.js';

class DemoElement extends AmfHelperMixin(LitElement) {}
window.customElements.define('demo-element', DemoElement);

class DemoPage extends ApiDemoPageBase {
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
    this._componentName = 'api-authorization-method';
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

    this._demoStateHandler = this._demoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._authTypeHandler = this._authTypeHandler.bind(this);
    this._mainChangeHandler = this._mainChangeHandler.bind(this);
    this._basicChangeHandler = this._basicChangeHandler.bind(this);
    this._ntlmChangeHandler = this._ntlmChangeHandler.bind(this);
    this._digestChangeHandler = this._digestChangeHandler.bind(this);
    this._oauth1ChangeHandler = this._oauth1ChangeHandler.bind(this);
    this._oauth2ChangeHandler = this._oauth2ChangeHandler.bind(this);

    window.addEventListener('oauth1-token-requested', this._oauth1TokenHandler.bind(this));
  }

  _toggleMainOption(e) {
    const { name, checked } = e.target;
    this[name] = checked;
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.demoState = state;
    this.outlined = state === 1;
    this.compatibility = state === 2;
  }

  get helper() {
    if (!this.__helper) {
      this.__helper = document.getElementById('helper');
    }
    return this.__helper;
  }

  get type() {
    const { securityType } = this;
    switch (securityType) {
      case 'Basic Authentication': return 'basic';
      case 'Digest Authentication': return 'digest';
      case 'Pass Through': return 'pass through';
      case 'OAuth 2.0': return 'oauth 2';
      case 'OAuth 1.0': return 'oauth 1';
      case 'Api Key': return 'api key';
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
    const helper = this.helper;
    const webApi = helper._computeWebApi(this.amf);
    const method = helper._computeMethodModel(webApi, selected);
    const key = helper._getAmfKey(helper.ns.aml.vocabularies.security.security);
    const shKey = helper._getAmfKey(helper.ns.aml.vocabularies.security.scheme);
    const schemesKey = helper._getAmfKey(helper.ns.aml.vocabularies.security.schemes);
    const security = helper._ensureArray(method[key]);
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
      type = helper._getValue(scheme, helper.ns.aml.vocabularies.security.type);
      if (type === 'Api Key') {
        auth = schemes;
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
    ].map(([file, label]) => html`
      <paper-item data-src="${file}-compact.json">${label} - compact model</paper-item>
      <paper-item data-src="${file}.json">${label}</paper-item>
      `);
  }

  _authTypeHandler(e) {
    const { name, checked, value } = e.target;
    if (!checked) {
      return;
    }
    this[name] = value;
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

          <label slot="options" id="listTypeLabel">Auth type</label>
          <anypoint-radio-group
            slot="options"
            selectable="anypoint-radio-button"
            aria-labelledby="listTypeLabel"
          >
            <anypoint-radio-button
              @change="${this._authTypeHandler}"
              checked
              name="authType"
              value="basic"
              >Basic</anypoint-radio-button
            >
            <anypoint-radio-button
              @change="${this._authTypeHandler}"
              name="authType"
              value="ntlm"
              >NTLM</anypoint-radio-button
            >
            <anypoint-radio-button
              @change="${this._authTypeHandler}"
              name="authType"
              value="digest"
              >Digest</anypoint-radio-button
            >
            <anypoint-radio-button
              @change="${this._authTypeHandler}"
              name="authType"
              value="oauth 1"
              >OAuth 1</anypoint-radio-button
            >
            <anypoint-radio-button
              @change="${this._authTypeHandler}"
              name="authType"
              value="oauth 2"
              >OAuth 2</anypoint-radio-button
            >
        </arc-interactive-demo>
        <p>Change events counter: ${mainChangesCounter}</p>
      </section>
    `;
  }

  contentTemplate() {
    const { amf } = this;
    return html`
      <oauth2-authorization></oauth2-authorization>
      <demo-element id="helper" .amf="${amf}"></demo-element>

      <h2>API authorization method</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
