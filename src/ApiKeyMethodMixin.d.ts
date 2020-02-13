// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html} from 'lit-element';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const restoreApiKey: Symbol;
export const serializeApiKey: Symbol;
export const validateApiKey: Symbol;
export const initializeApiKeyModel: Symbol;
export const renderApiKey: Symbol;
export const updateQueryParameterApiKey: Symbol;
export const updateHeaderApiKey: Symbol;
export const updateCookieApiKey: Symbol;
export const clearApiKey: Symbol;

export {ApiKeyMethodMixin};

declare type Constructor<T = {}> = new (...args: any[]) => T;
interface CustomMixin {
  clearApiKeyCache(): void;
}

declare function ApiKeyMethodMixin<TBase extends Constructor>(Base: TBase) : TBase & CustomMixin;
