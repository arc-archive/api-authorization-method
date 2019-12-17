// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html} from 'lit-element';
import {defaultSignatureMethods} from '@advanced-rest-client/authorization-method/src/Oauth1MethodMixin.js';

export const initializeOauth1Model: Symbol;

export {ApiOauth1MethodMixin};

declare type Constructor<T = {}> = new (...args: any[]) => T;
interface ApiOauth1Mixin {}

declare function ApiOauth1MethodMixin<TBase extends Constructor>(Base: TBase) : TBase & ApiOauth1Mixin;
