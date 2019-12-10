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
const createViewModel = Symbol();
const readParamsProperties = Symbol();
const headersTemplate = Symbol();
const queryTemplate = Symbol();
const formListTemplate = Symbol();
const formItemTemplate = Symbol();
const toggleDocumentation = Symbol();
const inputHandler = Symbol();
/**
 * Mixin that adds support for RAML's custom auth method computations
 *
 * @param {*} superClass
 * @return {*}
 * @mixin
 */
export const CustomMethodMixin = (superClass) => class extends superClass {
  get _transformer() {
    if (!this.__transformer) {
      this.__transformer = document.createElement('api-view-model-transformer');
    }
    return this.__transformer;
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.__transformer = null;
  }
  /**
   * Restores previously serialized values
   * @param {Oauth2Params} settings
   */
  [restoreCustom](settings) {
    if (!settings) {
      return;
    }
    // TODO: iterate over properties and restore values.
  }

  [serializeCustom]() {
    const { headers, queryParameters } = this;
    const result = {};
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
    return true;
  }

  [initializeCustomModel]() {
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
      this.headers = data;
    } else if (type === 'parameter') {
      this.queryParameters = data;
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
    const model = type === 'query' ? this.queryParameters : this.headers;
    const { value } = e.target;
    model[index].value = value;
    notifyChange(this);
  }

  [renderCustom]() {
    const {
      styles,
      schemeName,
      schemeDescription,
      compatibility,
      outlined,
      descriptionOpened,
    } = this;
    return html`
    <style>${styles}</style>
    ${schemeName ? html`<div class="scheme-header">
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
        </div>` : ''}
      </div>` : ''}
    <form autocomplete="on" class="custom-auth">
      ${this[headersTemplate]()}
      ${this[queryTemplate]()}
    </form>
    `;
  }

  [headersTemplate]() {
    return this[formListTemplate](this.headers, 'header');
  }

  [queryTemplate]() {
    return this[formListTemplate](this.queryParameters, 'query');
  }

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
   * Renders a form input item.
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
        ?readonly="${readOnly}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        data-type="${type}"
        data-index="${index}"
        @input="${this[inputHandler]}"
      ></api-property-form-item>
        ${item.hasDescription ? html`<anypoint-icon-button
          class="hint-icon"
          title="Toggle description"
          aria-label="Press to toggle description"
          data-type="${type}"
          data-index="${index}"
          @click="${this[toggleDocumentation]}"
        >
          <span class="icon">${help}</span>
        </anypoint-icon-button>` : undefined}
    </div>
    ${item.hasDescription && item.docsOpened ? html`<div class="docs-container">
      <arc-marked .markdown="${item.description}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : ''}`;
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
    const model = type === 'query' ? this.queryParameters : this.headers;
    model[index].docsOpened = !model[index].docsOpened;
    this.requestUpdate();
  }
}
