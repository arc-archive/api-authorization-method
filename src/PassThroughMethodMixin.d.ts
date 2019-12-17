// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html} from 'lit-element';
import {
  notifyChange,
} from '@advanced-rest-client/authorization-method/src/Utils.js';

export const restorePassThrough: Symbol;
export const serializePassThrough: Symbol;
export const validatePassThrough: Symbol;
export const initializePassThroughModel: Symbol;
export const renderPassThrough: Symbol;
export const updateQueryParameterPassThrough: Symbol;
export const updateHeaderPassThrough: Symbol;

export {PassThroughMethodMixin};

declare type Constructor<T = {}> = new (...args: any[]) => T;
interface PassThrough {}

declare function PassThroughMethodMixin<TBase extends Constructor>(Base: TBase) : TBase & PassThrough;
