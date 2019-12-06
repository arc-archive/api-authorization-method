import { html } from 'lit-element';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/api-property-form-item/api-property-form-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import { help } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import {
  getEventTarget,
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const initializeCustomModel = Symbol();
export const renderCustom = Symbol();
export const validateCustom = Symbol();
export const serializeCustom = Symbol();
export const restoreCustom = Symbol();
const headerChangedHandler = Symbol();
const parameterChangedHandler = Symbol();
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

  constructor() {
    super();
    this[headerChangedHandler] = this[headerChangedHandler].bind(this);
    this[parameterChangedHandler] = this[parameterChangedHandler].bind(this);
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.__transformer = null;
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('request-header-changed', this[headerChangedHandler]);
    node.addEventListener('query-parameter-changed', this[parameterChangedHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('request-header-changed', this[headerChangedHandler]);
    node.removeEventListener('query-parameter-changed', this[parameterChangedHandler]);
  }

  [headerChangedHandler](e) {
    this._updateEventValue(e, this.headers);
  }

  [parameterChangedHandler](e) {
    this._updateEventValue(e, this.queryParameters);
  }
  /**
   * Update array value for given type (`headers` or `queryParameters`) for given event.
   * @param {CustomEvent} e
   * @param {Array} model Model to use to update the value.
   */
  _updateEventValue(e, model) {
    if (!model || !model.length) {
      return;
    }
    if (e.defaultPrevented || getEventTarget(e) === this) {
      return;
    }
    const { name } = e.detail;
    if (!name || typeof name !== 'string') {
      return;
    }
    for (let i = 0, len = model.length; i < len; i++) {
      const pName = model[i].name;
      if (!pName) {
        continue;
      }
      if (pName === name) {
        model[i].value = e.detail.value;
        this.requestUpdate();
        notifyChange(this);
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
      headers.forEach((parameter) => result.queryParameters[parameter.name] = parameter.value);
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
  [createViewModel](type, model) {
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
    const index = Number(e.target.dataset.index);
    const type = e.target.dataset.type;
    if (index !== index || !type) {
      return;
    }
    const model = type === 'query' ? this.queryParameters : this.headers;
    const { value } = e.detail;
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
   * Renders a form input item
   *
   * @todo (pawel): make the `api-property-form-item` component to retarget
   * `input` event and switch event handling to `input` instead of `value-changed`.
   * The later one is dispatched even when the input is initialized causing unnecessary
   * change notification. The initial notification should be done by AMF change
   * observer. See https://github.com/advanced-rest-client/api-property-form-item/issues/3
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
        @value-changed="${this[inputHandler]}"
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
