import { html } from 'lit-element';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

const createViewModel = Symbol();
const headersParam = Symbol();
const queryParam = Symbol();
const cookiesParam = Symbol();
const titleTemplate = Symbol();
const headersTemplate = Symbol();
const queryTemplate = Symbol();
const cookieTemplate = Symbol();
const formListTemplate = Symbol();
const formItemTemplate = Symbol();
const inputHandler = Symbol();
const restoreModelValue = Symbol();
const updateModelValue = Symbol();

export const restoreApiKey = Symbol();
export const serializeApiKey = Symbol();
export const validateApiKey = Symbol();
export const initializeApiKeyModel = Symbol();
export const renderApiKey = Symbol();
export const updateQueryParameterApiKey = Symbol();
export const updateHeaderApiKey = Symbol();
export const updateCookieApiKey = Symbol();

/**
 * The `api-view-model-transformer` has insternal caching enabled to support
 * values caching when the user switches through methods in API definition.
 *
 * This creates a similar mechanism for caching since this mixin does not use
 * `api-view-model-transformer`.
 *
 * @type {Object}
 */
const CACHE = {
  header: {},
  query: {},
  cookie: {},
};

/**
 * @typedef SerializedValues
 * @param {Object=} headers List of serialized headers
 * @param {Object=} queryParameters List of serialized query parameters
 * @param {Object=} cookies List of serialized cookies
 */

/**
 * Mixin that adds support for OAS' API Key auth method computations
 *
 * @param {*} superClass
 * @return {*}
 * @mixin
 */
export const ApiKeyMethodMixin = (superClass) => class extends superClass {
  /**
   * Clears previouslt set values in the cache storage.
   */
  clearApiKeyCache() {
    CACHE.header = {};
    CACHE.query = {};
    CACHE.cookie = {};
  }

  /**
   * Updates query parameter value, if defined in the model.
   * @param {String} name
   * @param {String} newValue
   */
  [updateQueryParameterApiKey](name, newValue) {
    this[updateModelValue](this[queryParam], name, newValue);
  }

  /**
   * Updates header value, if defined in the model.
   * @param {String} name
   * @param {String} newValue
   */
  [updateHeaderApiKey](name, newValue) {
    this[updateModelValue](this[headersParam], name, newValue);
  }

  /**
   * Updates cookie value, if defined in the model.
   * @param {String} name
   * @param {String} newValue
   */
  [updateCookieApiKey](name, newValue) {
    this[updateModelValue](this[cookiesParam], name, newValue);
  }

  /**
   * Updates header or query parameters value, if defined in the model.
   * @param {Array<Object>} model Current model for the parameter
   * @param {String} name
   * @param {String} newValue
   */
  [updateModelValue](model, name, newValue) {
    if (!model || !model.length) {
      return;
    }
    for (let i = 0, len = model.length; i < len; i++) {
      const item = model[i];
      if (item.name === name) {
        item.value = newValue;
        this.requestUpdate();
        return;
      }
    }
  }

  /**
   * Restores previously serialized values
   * @param {Oauth2Params} settings
   */
  [restoreApiKey](settings) {
    if (!settings) {
      return;
    }
    this[restoreModelValue](this[headersParam], settings.headers);
    this[restoreModelValue](this[queryParam], settings.queryParameters);
    this[restoreModelValue](this[cookiesParam], settings.cookies);
    this.requestUpdate();
  }

  /**
   * Restores previously serialized values on a model
   * @param {Array<Object>=} model The model to add values to
   * @param {Object=} restored Previously serialized values
   */
  [restoreModelValue](model, restored) {
    if (!restored || !model || !model.length) {
      return;
    }
    Object.keys(restored).forEach((name) => {
      const item = model.find((item) => item.name === name);
      if (item) {
        item.value = restored[name];
      }
    });
  }

  /**
   * Serializes current values to a settings object
   * @return {SerializedValues}
   */
  [serializeApiKey]() {
    const headers = this[headersParam];
    const queryParameters = this[queryParam];
    const cookieParameters = this[cookiesParam];
    const result = {};
    // Note, in API model, headers and params are unique. They may have array
    // value but they are always qunique.
    if (headers && headers.length) {
      result.headers = {};
      headers.forEach((header) => result.headers[header.name] = header.value);
    }
    if (queryParameters && queryParameters.length) {
      result.queryParameters = {};
      queryParameters.forEach((parameter) => result.queryParameters[parameter.name] = parameter.value);
    }
    if (cookieParameters && cookieParameters.length) {
      result.cookies = {};
      cookieParameters.forEach((parameter) => result.cookies[parameter.name] = parameter.value);
    }
    return result;
  }

  /**
   * Performs a validation of current form.
   * By calling this function invalid field are going to be marked as invalid.
   *
   * In the implementation it calls `validate()` function on each input element
   * that is inserted into the DOM.
   *
   * @return {Boolean} validation
   */
  [validateApiKey]() {
    const nodes = this.shadowRoot.querySelectorAll('api-property-form-item');
    let validationResult = true;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const node = nodes[i];
      const result = node.validate();
      if (validationResult && !result) {
        validationResult = result;
      }
    }
    return validationResult;
  }

  /**
   * Processes AMF model and generates the view.
   *
   * Note, this function clears previously set parameters.
   *
   * @return {Promise}
   */
  async [initializeApiKeyModel]() {
    this[headersParam] = [];
    this[queryParam] = [];
    this[cookiesParam] = [];

    let { security } = this;
    if (!security) {
      return;
    }
    if (!Array.isArray(security)) {
      security = [security];
    }
    const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
    for (let i = 0, len = security.length; i < len; i++) {
      const item = security[i];
      if (!this._hasType(item, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
        continue;
      }
      let scheme = item[shKey];
      if (!scheme) {
        continue;
      }
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      const type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
      if (!type || type.indexOf('Api Key') !== 0) {
        continue;
      }
      this[createViewModel](scheme);
    }
    this.requestUpdate();
    await this.updateComplete;
    notifyChange(this);
  }

  /**
   * Generates view model for Api Key method.
   *
   * @param {Object} model
   */
  [createViewModel](model) {
    if (!model) {
      return;
    }
    const settingsKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
    let settings = model[settingsKey];
    if (!settings) {
      return;
    }
    if (Array.isArray(settings)) {
      settings = settings[0];
    }
    const name = this._getValue(settings, this.ns.aml.vocabularies.core.name);
    const binding = this._getValue(settings, this.ns.aml.vocabularies.security.in);

    let result = CACHE[binding][name];
    if (!result) {
      result = CACHE[binding][name] = {
        binding,
        name,
        required: true,
        value: '',
        description: '',
        hasDescription: false,
        schema: {
          type: 'string',
          inputLabel: 'Value of the ' + binding,
          inputType: 'text',
          isEnum: false,
          isArray: false,
          isBool: false,
          isFile: false,
          isObject: false,
          isNillable: false,
          isUnion: false,
          enabled: true,
          hasExtendedDescription: false,
        }
      };
    }
    switch (binding) {
      case 'query':
        this[queryParam].push(result);
      break;
      case 'header':
        this[headersParam].push(result);
      break;
      case 'cookie':
        this[cookiesParam].push(result);
      break;
    }
  }

  /**
   * Handler for the `value-changed` event disaptched by input element.
   * Dispatches 'request-header-changed' or 'query-parameter-changed'
   * event. Other components can update their state when the value change.
   *
   * @param {CustomEvent} e
   */
  [inputHandler](e) {
    if (e.composedPath && e.composedPath()[0] !== e.target) {
      return;
    }
    const index = Number(e.target.dataset.index);
    const type = e.target.dataset.type;
    if (index !== index || !type) {
      return;
    }
    let model;
    switch (type) {
      case 'query': model = this[queryParam]; break;
      case 'header': model = this[headersParam]; break;
      case 'cookie': model = this[cookiesParam]; break;
    }
    const { value } = e.target;
    model[index].value = value;
    notifyChange(this);
  }

  /**
   * Method that renders the view for Api Key security scheme
   *
   * @return {TemplateResult}
   */
  [renderApiKey]() {
    const {
      styles,
    } = this;
    return html`
    <style>${styles}</style>
    ${this[titleTemplate]()}
    <form autocomplete="on" class="custom-auth">
      ${this[headersTemplate]()}
      ${this[queryTemplate]()}
      ${this[cookieTemplate]()}
    </form>
    `;
  }

  /**
   * Method that renders scheme's title
   *
   * @return {TemplateResult}
   */
  [titleTemplate]() {
    return html`
    <div class="subtitle">
      <span>Scheme: Api Key</span>
    </div>`;
  }

  /**
   * Method that renders headers, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [headersTemplate]() {
    let result = this[formListTemplate](this[headersParam], 'header');
    if (result !== '') {
      result = html`
      <label class="section-title">Headers</label>
      ${result}
      `;
    }
    return result;
  }

  /**
   * Method that renders query parameters, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [queryTemplate]() {
    let result = this[formListTemplate](this[queryParam], 'query');
    if (result !== '') {
      result = html`
      <label class="section-title">Query parameters</label>
      ${result}
      `;
    }
    return result;
  }

  /**
   * Method that renders cookies, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  [cookieTemplate]() {
    let result = this[formListTemplate](this[cookiesParam], 'cookie');
    if (result !== '') {
      result = html`
      <label class="section-title">Cookies</label>
      ${result}
      `;
    }
    return result;
  }

  /**
   * Returns a TemplateResult for form items.
   * @param {Array<Object>} items List of form items to render
   * @param {String} type Items type. Either `query` or `header`
   * @return {TemplateResult}
   */
  [formListTemplate](items, type) {
    if (!items || !items.length) {
      return '';
    }
    const {
      outlined,
      compatibility,
      readOnly,
      disabled,
    } = this;

    return html`
    ${items.map((item, index) =>
    this[formItemTemplate](item, index, outlined, compatibility, readOnly, disabled, type))}`;
  }

  /**
   * Returns a TemplateResult for a form input item
   *
   * @param {Object} item
   * @param {Number} index
   * @param {Boolean} outlined
   * @param {Boolean} compatibility
   * @param {Boolean} readOnly
   * @param {Boolean} disabled
   * @param {String} type
   * @return {TemplateResult}
   */
  [formItemTemplate](item, index, outlined, compatibility, readOnly, disabled, type) {
    return html`<div class="field-value">
      <api-property-form-item
        .model="${item}"
        .value="${item.value}"
        name="${item.name}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?readonly="${readOnly}"
        ?disabled="${disabled}"
        required
        autovalidate
        data-type="${type}"
        data-index="${index}"
        @input="${this[inputHandler]}"
      ></api-property-form-item>
    </div>`;
  }
}
