// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html} from 'lit-element';
import {
  oauth2GrantTypes,
  oauth2CustomPropertiesTemplate,
  autoHide,
  serializeOauth2Auth,
} from '@advanced-rest-client/authorization-method/src/Oauth2MethodMixin.js';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const initializeOauth2Model: Symbol;

export {ApiOauth2MethodMixin};

declare type Constructor<T = {}> = new (...args: any[]) => T;
interface ApiOauth2Mixin {}

declare function ApiOauth2MethodMixin<TBase extends Constructor>(Base: TBase) : TBase & ApiOauth2Mixin;
