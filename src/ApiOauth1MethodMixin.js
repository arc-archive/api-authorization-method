import {
  defaultSignatureMethods,
} from '@advanced-rest-client/authorization-method/src/Oauth1MethodMixin.js';

export const initializeOauth1Model = Symbol();
const preFillAmfData = Symbol();
/**
 * Mixin that adds support for RAML's custom auth method computations
 *
 * @param {*} superClass
 * @return {*}
 * @mixin
 */
export const ApiOauth1MethodMixin = (superClass) => class extends superClass {
  [initializeOauth1Model]() {
    const { security } = this;
    if (!this._hasType(security, this.ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      this.signatureMethods = defaultSignatureMethods;
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
    const isOauth1 = type === 'OAuth 1.0';
    if (!isOauth1) {
      this.signatureMethods = defaultSignatureMethods;
      return;
    }
    const sKey = this._getAmfKey(this.ns.aml.vocabularies.security.settings);
    let settings = scheme[sKey];
    if (settings instanceof Array) {
      settings = settings[0];
    }
    this[preFillAmfData](settings);
    this.requestUpdate();
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
    if (!this._hasType(model, sec.OAuth1Settings)) {
      return;
    }
    this.requestTokenUri = this._getValue(model, sec.requestTokenUri);
    this.authorizationUri = this._getValue(model, sec.authorizationUri);
    this.accessTokenUri = this._getValue(model, sec.tokenCredentialsUri);
    const signaturtes = this._getValueArray(model, sec.signature);
    if (!signaturtes || !signaturtes.length) {
      this.signatureMethods = defaultSignatureMethods;
    } else {
      this.signatureMethods = signaturtes;
    }
  }
}
