import { html } from 'lit-element';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/api-property-form-item/api-property-form-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import { help } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const initializeCustomModel = Symbol();
export const renderCustom = Symbol();
export const validateCustom = Symbol();
export const serializeCustom = Symbol();
export const restoreCustom = Symbol();
export const updateQueryParameterCustom = Symbol();
export const updateHeaderCustom = Symbol();
export const clearCustom = Symbol();
const createViewModel = Symbol();
const readParamsProperties = Symbol();
const headersTemplate = Symbol();
const queryTemplate = Symbol();
const formListTemplate = Symbol();
const formItemTemplate = Symbol();
const toggleDocumentation = Symbol();
const formItemHelpButtonTemplate = Symbol();
const formItemHelpTemplate = Symbol();
const inputHandler = Symbol();
const headersParam = Symbol();
const queryParametersParam = Symbol();
const titleTemplate = Symbol();
const updateModelValue = Symbol();
const restoreModelValue = Symbol();
/**
 * Mixin that adds support for RAML's custom auth method computations
 *
 * @param {*} superClass
 * @return {*}
 * @mixin
 */
export const CustomMethodMixin = (superClass) => class extends superClass {
  /**
   * Updates query parameter value, if defined in the model.
   * @param {String} name
   * @param {String} newValue
   */
  [updateQueryParameterCustom](name, newValue) {
    this[updateModelValue]('query', name, newValue);
  }

  /**
   * Updates header value, if defined in the model.
   * @param {String} name
   * @param {String} newValue
   */
  [updateHeaderCustom](name, newValue) {
    this[updateModelValue]('header', name, newValue);
  }

  /**
   * Updates header or query parameters value, if defined in the model.
   * @param {String} type
   * @param {String} name
   * @param {String} newValue
   */
  [updateModelValue](type, name, newValue) {
    const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
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
  [restoreCustom](settings) {
    if (!settings) {
      return;
    }
    this[restoreModelValue]('headers', settings.headers);
    this[restoreModelValue]('query', settings.queryParameters);
    this.requestUpdate();
  }

  [restoreModelValue](type, restored) {
    if (!restored) {
      return;
    }
    const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
    if (!model || !model.length) {
      return;
    }
    Object.keys(restored).forEach((name) => {
      const item = model.find((item) => item.name === name);
      if (item) {
        item.value = restored[name];
      }
    });
  }

  [clearCustom]() {
    const headers = this[headersParam];
    const queryParameters = this[queryParametersParam];
    if (Array.isArray(headers)) {
      headers.forEach((header) => header.value = '');
    }
    if (Array.isArray(queryParameters)) {
      queryParameters.forEach((parameter) => parameter.value = '');
    }
  }

  [serializeCustom]() {
    const headers = this[headersParam];
    const queryParameters = this[queryParametersParam];
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
    return result;
  }

  [validateCustom]() {
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

  [initializeCustomModel]() {
    this.schemeName = undefined;
    this.schemeDescription = undefined;
    this[headersParam] = undefined;
    this[queryParametersParam] = undefined;
    const { security } = this;
    if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      return;
    }
    const shKey = this._getAmfKey(this.ns.aml.vocabularies.security.scheme);
    let scheme = security[shKey];
    if (!scheme) {
      return;
    }
    let type;
    if (scheme) {
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      type = this._getValue(scheme, this.ns.aml.vocabularies.security.type);
    }
    if (!type || type.indexOf('x-') !== 0) {
      return;
    }
    const hKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.header);
    this[createViewModel]('header', this._ensureArray(scheme[hKey]));
    const params = this[readParamsProperties](scheme);
    this[createViewModel]('parameter', params);
    this.schemeName = this._getValue(security, this.ns.aml.vocabularies.core.name);
    this.schemeDescription = this._getValue(scheme, this.ns.aml.vocabularies.core.description);
    this.requestUpdate();
  }

  /**
   * Generates view model using the tranformer.
   *
   * @param {String} type Param type. Either `header` or `parameter`.
   * @param {Array} model
   */
  async [createViewModel](type, model) {
    if (!model) {
      return;
    }
    const factory = this._transformer;
    factory.amf = this.amf;
    const data = factory.computeViewModel(model);
    if (!data) {
      return;
    }
    if (type === 'header') {
      this[headersParam] = data;
    } else if (type === 'parameter') {
      this[queryParametersParam] = data;
    }
    await this.updateComplete;
    notifyChange(this);
  }
  /**
   * Reads definition of properties for query parameters which can be either a
   * `parameter` or a `queryString`.
   *
   * @param {Object} scheme Security `scheme` model.
   * @return {Array<Object>|undefined} A list of parameters, if any.
   */
  [readParamsProperties](scheme) {
    const pKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.parameter);
    let result = this._ensureArray(scheme[pKey]);
    if (result) {
      return result;
    }
    const qKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.queryString);
    result = this._ensureArray(scheme[qKey]);
    if (result) {
      result = result[0];
    }
    return result;
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
    const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
    const { value } = e.target;
    model[index].value = value;
    notifyChange(this);
  }

  [renderCustom]() {
    const {
      styles,
    } = this;
    return html`
    <style>${styles}</style>
    ${this[titleTemplate]()}
    <form autocomplete="on" class="custom-auth">
      ${this[headersTemplate]()}
      ${this[queryTemplate]()}
    </form>
    `;
  }

  [titleTemplate]() {
    const {
      schemeName,
      schemeDescription,
      compatibility,
      outlined,
      descriptionOpened,
    } = this;
    if (!schemeName) {
      return '';
    }
    return html`
    <div class="subtitle">
      <span>Scheme: ${schemeName}</span>
      ${schemeDescription ? html`<anypoint-icon-button
        class="hint-icon"
        title="Toggle description"
        aria-label="Activate to toggle the description"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        @click="${this.toggleDescription}"
      >
        <span class="icon">${help}</span>
      </anypoint-icon-button>` : ''}
    </div>
    ${schemeDescription && descriptionOpened ? html`<div class="docs-container">
      <arc-marked .markdown="${schemeDescription}" main-docs sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : ''}`;
  }

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

  [queryTemplate]() {
    let result = this[formListTemplate](this[queryParametersParam], 'query');
    if (result !== '') {
      result = html`
      <label class="section-title">Query parameters</label>
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
    const docs = item.extendedDescription || item.description;
    const hasDocs = !!docs;
    return html`<div class="field-value">
      <api-property-form-item
        .model="${item}"
        .value="${item.value}"
        name="${item.name}"
        ?readonly="${readOnly}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        data-type="${type}"
        data-index="${index}"
        @input="${this[inputHandler]}"
      ></api-property-form-item>
      ${this[formItemHelpButtonTemplate](hasDocs, type, index)}
    </div>
    ${this[formItemHelpTemplate](hasDocs, item.docsOpened, docs)}`;
  }

  /**
   * Returns a TemplateResult for docs toggle icon for a form item when the item has docs.
   * @param {Boolean} hasDocs
   * @param {String} type
   * @param {Number} index
   * @return {TemplateResult}
   */
  [formItemHelpButtonTemplate](hasDocs, type, index) {
    if (!hasDocs) {
      return '';
    }
    return html`<anypoint-icon-button
      class="hint-icon"
      title="Toggle description"
      aria-label="Press to toggle description"
      data-type="${type}"
      data-index="${index}"
      @click="${this[toggleDocumentation]}"
    >
      <span class="icon">${help}</span>
    </anypoint-icon-button>`;
  }
  /**
   * Returns a TemplateResult for docs for a form item when the item has docs and is opened.
   * @param {Boolean} hasDocs
   * @param {Boolean} opened
   * @param {String} docs
   * @return {TemplateResult}
   */
  [formItemHelpTemplate](hasDocs, opened, docs) {
    if (!hasDocs || !opened) {
      return '';
    }
    return html`
    <div class="docs-container">
      <arc-marked .markdown="${docs}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>`;
  }

  /**
   * Toggles documentartion for custom property.
   *
   * @param {CustomEvent} e
   */
  [toggleDocumentation](e) {
    const index = Number(e.currentTarget.dataset.index);
    const type = e.currentTarget.dataset.type;
    if (index !== index || !type) {
      return;
    }
    const model = type === 'query' ? this[queryParametersParam] : this[headersParam];
    model[index].docsOpened = !model[index].docsOpened;
    this.requestUpdate();
  }
}
