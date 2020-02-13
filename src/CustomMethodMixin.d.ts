// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html} from 'lit-element';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const initializeCustomModel: Symbol;
export const renderCustom: Symbol;
export const validateCustom: Symbol;
export const restoreCustom: Symbol;
export const updateQueryParameterCustom: Symbol;
export const updateHeaderCustom: Symbol;
export const clearCustom: Symbol;

export {CustomMethodMixin};

declare type Constructor<T = {}> = new (...args: any[]) => T;
interface CustomMixin {}

declare function CustomMethodMixin<TBase extends Constructor>(Base: TBase) : TBase & CustomMixin;
