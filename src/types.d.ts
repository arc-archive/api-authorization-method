export declare interface StringMap {[key: string]: string}  
export declare interface ApiKeySettings {
  /**
   * List of headers to apply to the request
   */
  headers?: StringMap;
  /**
   * List of query parameters to apply to the request
   */
  queryParameters?: StringMap;
  /**
   * List of cookies to apply to the request
   */
  cookies?: StringMap;
}

export declare interface PassThroughSetting {
  /**
   * List of headers to apply to the request
   */
  headers?: StringMap;
  /**
   * List of query parameters to apply to the request
   */
  queryParameters?: StringMap;
}

export declare interface RamlCustomSetting {
  /**
   * List of headers to apply to the request
   */
  headers?: StringMap;
  /**
   * List of query parameters to apply to the request
   */
  queryParameters?: StringMap;
}