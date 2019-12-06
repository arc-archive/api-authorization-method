import { html } from 'lit-element';
import {
  oauth2GrantTypes,
  oauth2CustomPropertiesTemplate,
} from '@advanced-rest-client/authorization-method/src/Oauth2MethodMixin.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';

export const initializeOauth2Model = Symbol();
const setupOAuthDeliveryMethod = Symbol();
const getOauth2DeliveryMethod = Symbol();
const updateGrantTypes = Symbol();
const preFillAmfData = Symbol();
const readSecurityScopes = Symbol();
const amfCustomSettingsKey = Symbol();
const applyAnnotationGrants = Symbol();
const setupAnotationParameters = Symbol();
const setupAuthRequestQueryParameters = Symbol();
const setupTokenRequestQueryParameters = Symbol();
const setupTokenRequestHeaders = Symbol();
const setupTokenRequestBody = Symbol();
const createViewModel = Symbol();
const computeGrantList = Symbol();
/**
 * Mixin that adds support for RAML's custom auth method computations
 *
 * @param {*} superClass
 * @return {*}
 * @mixin
 */
export const ApiOauth2MethodMixin = (superClass) => class extends superClass {
  [initializeOauth2Model]() {
    const { security } = this;
    if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      this[setupOAuthDeliveryMethod]();
      this[updateGrantTypes]();
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
    const isOauth2 = type === 'OAuth 2.0';
    if (!isOauth2) {
      this[setupOAuthDeliveryMethod]();
      this[updateGrantTypes]();
      return;
    }
    this[setupOAuthDeliveryMethod](scheme);

    const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
    let settings = scheme[sKey];
    if (settings instanceof Array) {
      settings = settings[0];
    }
    this[preFillAmfData](settings);
    // this._autoHide();
  }

  [setupOAuthDeliveryMethod](scheme) {
    const info = this[getOauth2DeliveryMethod](scheme);
    if (this.oauthDeliveryMethod !== info.method) {
      this.oauthDeliveryMethod = info.method;
    }
    if (this.oauthDeliveryName !== info.name) {
      this.oauthDeliveryName = info.name;
    }
  }
  /**
   * Determines placemenet of OAuth authorization token location.
   * It can be either query parameter or header. This function
   * reads API spec to get this information or provides default if
   * not specifies.
   *
   * @param {Object} info Security AMF model
   * @return {Object}
   */
  [getOauth2DeliveryMethod](info) {
    const result = {
      method: 'header',
      name: 'authorization'
    };
    if (!info) {
      return result;
    }
    const hKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.header);
    const pKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.parameter);
    const nKey = this._getAmfKey(this.ns.aml.vocabularies.core.name);
    let header = info[hKey];
    if (header instanceof Array) {
      header = header[0];
    }
    if (header) {
      const headerName = this._getValue(header, nKey);
      if (headerName) {
        result.name = headerName;
        return result;
      }
    }
    let parameter = info[pKey];
    if (parameter instanceof Array) {
      parameter = parameter[0];
    }
    if (parameter) {
      const paramName = this._getValue(parameter, nKey);
      if (paramName) {
        result.name = paramName;
        result.method = 'query';
        return result;
      }
    }
    return result;
  }
  /**
   * Updates list of OAuth grant types supported by current endpoint.
   * The information should be available in RAML file.
   *
   * @param {Array<String>?} supportedTypes List of supported types. If empty
   * or not set then all available types will be displayed.
   */
  [updateGrantTypes](supportedTypes) {
    const available = this[computeGrantList](supportedTypes);
    this.grantTypes = available;
    // check if current selection is still available
    const current = this.grantType;
    const hasCurrent = current ?
      available.some((item) => item.type === current) : false;
    if (!hasCurrent) {
      this.grantType = available[0].type;
    } else if (available.length === 1) {
      this.grantType = available[0].type;
    }
  }
  /**
   * Computes list of grant types to render in the form.
   *
   * @param {?Array<String>} allowed List of types allowed by the
   * component configuration or API spec applied to this element. If empty
   * or not set then all OAuth 2.0 default types are returned.
   * @return {Array<Object>}
   */
  [computeGrantList](allowed) {
    let defaults = oauth2GrantTypes;
    if (!allowed || !allowed.length) {
      return defaults;
    }
    allowed = Array.from(allowed);
    for (let i = defaults.length - 1; i >= 0; i--) {
      const index = allowed.indexOf(defaults[i].type);
      if (index === -1) {
        defaults.splice(i, 1);
      } else {
        allowed.splice(index, 1);
      }
    }
    if (allowed.length) {
      allowed = allowed.map(function(item) {
        return {
          label: item,
          type: item
        };
      });
      defaults = defaults.concat(allowed);
    }
    return defaults;
  }
  /**
   * Reads API security definition and applies in to the view as predefined
   * values.
   *
   * @param {Object} model AMF model describing settings of the security
   * scheme
   */
  [preFillAmfData](model){
    if (!model) {
      return;
    }
    const sec = this.ns.aml.vocabularies.security;
    if (!this._hasType(model, sec.OAuth2Settings)) {
      return;
    }
    this.authorizationUri = this._getValue(model, sec.authorizationUri) || '';
    this.accessTokenUri = this._getValue(model, sec.accessTokenUri) || '';
    this.scopes = this[readSecurityScopes](model[this._getAmfKey(sec.scope)]);
    const apiGrants = this._getValueArray(model, sec.authorizationGrant);
    const annotationKey = this[amfCustomSettingsKey](model);
    const annotation = annotationKey ? model[annotationKey] : undefined;
    const grants = this[applyAnnotationGrants](apiGrants, annotation);
    if (grants && grants instanceof Array && grants.length) {
      const index = grants.indexOf('code');
      if (index !== -1) {
        grants[index] = 'authorization_code';
      }
      this[updateGrantTypes](grants);
    } else {
      this[updateGrantTypes]();
    }
    this[setupAnotationParameters](annotation);
  }
  /**
   * Extracts scopes list from the security definition
   * @param {Array} model
   * @return {Array<String>|undefined}
   */
  [readSecurityScopes](model) {
    model = this._ensureArray(model);
    if (!model) {
      return;
    }
    const result = [];
    for (let i = 0, len = model.length; i < len; i++) {
      const value = this._getValue(model[i], this.ns.aml.vocabularies.core.name);
      if (!value) {
        continue;
      }
      result.push(value);
    }
    return result;
  }
  /**
   * Finds a key for Custom settings
   * @param {Object} model Security scheme settings object.
   * @return {String|undefined}
   */
  [amfCustomSettingsKey](model) {
    const keys = Object.keys(model);
    const data = this.ns.aml.vocabularies.data;
    const settingsKeys = [
      this._getAmfKey(data + 'authorizationSettings'),
      this._getAmfKey(data + 'authorizationGrants'),
      this._getAmfKey(data + 'accessTokenSettings')
    ];
    for (let i = 0; i < keys.length; i++) {
      const node = model[keys[i]];
      if (node[settingsKeys[0]] || node[settingsKeys[1]] || node[settingsKeys[2]]) {
        return keys[i];
      }
    }
  }
  /**
   * Applies `authorizationGrants` from OAuth2 settings annotation.
   *
   * @param {Array} gransts OAuth spec grants available for the endpoint
   * @param {?Object} annotation Read annotation.
   * @return {Array} List of granst to apply.
   */
  [applyAnnotationGrants](gransts, annotation) {
    if (!annotation) {
      return gransts;
    }
    if (!gransts) {
      gransts = [];
    }
    const d = this.ns.aml.vocabularies.data;
    let model = annotation[this._getAmfKey(d + 'authorizationGrants')];
    model = this._ensureArray(model);
    if (!model || !model.length) {
      return gransts;
    }
    const list = model[0][this._getAmfKey(this.ns.w3.rdfSchema.member)];
    const addedGrants = [];
    list.forEach((item) => {
      const v = this._getValue(item, d + 'value');
      if (!v) {
        return;
      }
      addedGrants.push(v);
    });
    if (!addedGrants.length) {
      return gransts;
    }
    const ignoreKey = d + 'ignoreDefaultGrants';
    if (typeof annotation[ignoreKey] !== 'undefined') {
      gransts = [];
    }
    gransts = gransts.concat(addedGrants);
    return gransts;
  }
  /**
   * Sets up annotation supported variables to apply form view for:
   * - authorization query parameters
   * - authorization headers
   * - token query parameters
   * - token headers
   * - token body
   *
   * @param {Object} annotation Annotation applied to the OAuth settings
   */
  [setupAnotationParameters](annotation) {
    /* istanbul ignore if */
    if (this._authQueryParameters) {
      this._authQueryParameters = undefined;
    }
    /* istanbul ignore if */
    if (this._tokenQueryParameters) {
      this._tokenQueryParameters = undefined;
    }
    /* istanbul ignore if */
    if (this._tokenHeaders) {
      this._tokenHeaders = undefined;
    }
    /* istanbul ignore if */
    if (this._tokenBody) {
      this._tokenBody = undefined;
    }
    /* istanbul ignore if */
    if (!annotation) {
      return;
    }
    const d = this.ns.aml.vocabularies.data;
    // these are non standard data properties and therefore
    // the namespace has no information  about them.
    const qpKey = this._getAmfKey(d + 'queryParameters');
    let authSettings = annotation[this._getAmfKey(d + 'authorizationSettings')];
    let tokenSettings = annotation[this._getAmfKey(d + 'accessTokenSettings')];
    if (authSettings) {
      if (authSettings instanceof Array) {
        authSettings = authSettings[0];
      }
      const qp = authSettings[qpKey];
      if (qp) {
        this[setupAuthRequestQueryParameters](qp);
      }
    }
    if (tokenSettings) {
      if (tokenSettings instanceof Array) {
        tokenSettings = tokenSettings[0];
      }
      const qp = tokenSettings[qpKey];
      const headers = tokenSettings[this._getAmfKey(d + 'headers')];
      const body = tokenSettings[this._getAmfKey(d + 'body')];
      if (qp) {
        this[setupTokenRequestQueryParameters](qp);
      }
      if (headers) {
        this[setupTokenRequestHeaders](headers);
      }
      if (body) {
        this[setupTokenRequestBody](body);
      }
    }
  }
  /**
   * Sets up query parameters to be used with authorization request.
   *
   * @param {Array} params List of parameters from the annotation.
   */
  [setupAuthRequestQueryParameters](params) {
    const model = this[createViewModel](params, this._queryModelOpts);
    /* istanbul ignore if */
    if (!model) {
      return;
    }
    this._authQueryParameters = model;
  }
  /**
   * Sets up query parameters to be used with token request.
   *
   * @param {Array} params List of parameters from the annotation.
   */
  [setupTokenRequestQueryParameters](params) {
    const model = this[createViewModel](params, this._queryModelOpts);
    /* istanbul ignore if */
    if (!model) {
      return;
    }
    this._tokenQueryParameters = model;
  }
  /**
   * Sets up headers to be used with token request.
   *
   * @param {Array} params List of parameters from the annotation.
   */
  [setupTokenRequestHeaders](params) {
    const model = this[createViewModel](params, this._headersModelOpts);
    /* istanbul ignore if */
    if (!model) {
      return;
    }
    this._tokenHeaders = model;
  }
  /**
   * Sets up body parameters to be used with token request.
   *
   * @param {Array} params List of parameters from the annotation.
   */
  [setupTokenRequestBody](params) {
    const model = this[createViewModel](params, this._queryModelOpts);
    /* istanbul ignore if */
    if (!model) {
      return;
    }
    this._tokenBody = model;
  }
  /**
   * Creats a form view model for type items.
   *
   * @param {Array|object} param Property or list of properties to process.
   * @param {Object} modelOptions
   * @return {Array|undefined} Form view model or undefined if not set.
   */
  [createViewModel](param, modelOptions) {
    /* istanbul ignore if */
    if (!param) {
      return;
    }
    if (param instanceof Array) {
      param = param[0];
    }
    const factory = document.createElement('api-view-model-transformer');
    factory.amf = this.amf;
    return factory.modelForRawObject(param, modelOptions);
  }

  [oauth2CustomPropertiesTemplate]() {
    return html`aaaaaaaaaaa`;
  }
}
