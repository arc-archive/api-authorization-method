import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import * as sinon from 'sinon';
import { AmfLoader } from './amf-loader.js';
import '../api-authorization-method.js';

describe('Api Key authorization', function() {
  async function basicFixture(amf, security) {
    return (await fixture(html`<api-authorization-method
      type="Api Key"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`));
  }

  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurities(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout();
    return element;
  }

  const fileName = 'api-keys';

  [
    ['Full model', false],
    ['Compact model', true]
  ].forEach(([label, compact]) => {
    describe(label, () => {
      describe('initialization', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('can be initialized in a template with model', async () => {
          const security = AmfLoader.lookupSecurities(amf, '/query', 'get');
          const element = await basicFixture(amf, security);
          await aTimeout();
          assert.ok(element);
        });
      });

      describe('content rendering', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('renders headers', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item[data-type="header"]`);
          assert.lengthOf(nodes, 1);
        });

        it('renders query parameters', async () => {
          const element = await modelFixture(amf, '/query', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item[data-type="query"]`);
          assert.lengthOf(nodes, 1);
        });

        it('renders cookies', async () => {
          const element = await modelFixture(amf, '/cookie', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item[data-type="cookie"]`);
          assert.lengthOf(nodes, 1);
        });

        it('renders multiple schemes', async () => {
          const element = await modelFixture(amf, '/junction', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item`);
          assert.lengthOf(nodes, 2);
        });

        it('renders scheme title', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          const node = element.shadowRoot.querySelector(`.subtitle`);
          const result = node.textContent.trim();
          assert.equal(result, 'Scheme: Api Key');
        });
      });

      describe('change notification', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('notifies when value change', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          const input = element.shadowRoot.querySelector(`[name="client_secret"]`);
          input.value = 'test';
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          input.dispatchEvent(new CustomEvent('input'));
          assert.isTrue(spy.called);
        });

        it('notifies when cookie value change', async () => {
          const element = await modelFixture(amf, '/cookie', 'get');
          const input = element.shadowRoot.querySelector(`[name="client_secret"]`);
          input.value = 'test';
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          input.dispatchEvent(new CustomEvent('input'));
          assert.isTrue(spy.called);
        });

        it('notifies when AMF model change', async () => {
          const security = AmfLoader.lookupSecurities(amf, '/header', 'get');
          const element = await basicFixture(amf);
          element.security = security;
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          await aTimeout();
          assert.isTrue(spy.called);
        });
      });

      describe('updateQueryParameter()', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('updates query parameter value', async () => {
          const element = await modelFixture(amf, '/query', 'get');
          element.updateQueryParameter('client_id', 'test');
          const result = element.serialize();
          assert.equal(result.queryParameters.client_id, 'test');
        });

        it('ignores when no model', async () => {
          const element = await basicFixture(amf);
          element.updateQueryParameter('client_id', 'test');
          // no error
        });
      });

      describe('updateHeader()', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('updates header value', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          element.updateHeader('client_secret', 'testHeader');
          const result = element.serialize();
          assert.equal(result.headers.client_secret, 'testHeader');
        });

        it('ignores when no model', async () => {
          const element = await basicFixture(amf);
          element.updateHeader('client_secret', 'test');
          // no error
        });
      });

      describe('updateCookie()', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('updates cookie value', async () => {
          const element = await modelFixture(amf, '/cookie', 'get');
          element.updateCookie('client_secret', 'secret');
          const result = element.serialize();
          assert.equal(result.cookies.client_secret, 'secret');
        });

        it('ignores when no model', async () => {
          const element = await basicFixture(amf);
          element.updateCookie('client_secret', 'secret');
          // no error
        });
      });

      describe('restore()', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('restores configuration from previously serialized values', async () => {
          const element = await modelFixture(amf, '/junction', 'get');
          const values = {
            headers: {
              client_multi: 'cmv'
            },
            queryParameters: {
              client_id: 'civ',
            }
          };
          element.restore(values);
          const result = element.serialize();
          assert.equal(result.headers.client_multi, 'cmv');
          assert.equal(result.queryParameters.client_id, 'civ');
        });

        it('ignores non existing model items`', async () => {
          const element = await modelFixture(amf, '/junction', 'get');
          const values = {
            headers: {
              other: 'test'
            },
            queryParameters: {
              other: 'test'
            }
          };
          element.restore(values);
          const result = element.serialize();
          assert.isUndefined(result.headers.other);
          assert.isUndefined(result.queryParameters.other);
        });

        it('ignores when no models', async () => {
          const element = await basicFixture(amf);
          const values = {
            headers: {
              client_multi: 'test-restore-header'
            },
          };
          element.restore(values);
          const result = element.serialize();
          assert.deepEqual(result, {});
        });

        it('ignores when no argument', async () => {
          const element = await modelFixture(amf, '/junction', 'get');
          element.restore();
          // no error
        });
      });

      describe('validate()', () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });

          element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/query', 'get');
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('returns false when field is invalid', () => {
          const result = element.validate();
          assert.isFalse(result);
        });

        it('renders required field invalid', () => {
          element.validate();
          const input = element.shadowRoot.querySelector(`[name="client_id"]`);
          assert.isTrue(input.invalid);
        });

        it('returns true when valid', async () => {
          const input = element.shadowRoot.querySelector(`[name="client_id"]`);
          input.value = 'test';
          input.dispatchEvent(new CustomEvent('input'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result);
        });
      });

      describe('caching results', () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });

          element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        afterEach(async () => {
          const element = await basicFixture(amf);
          element.clearApiKeyCache();
        });

        it('caches result so it can be restored', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          element.updateHeader('client_secret', 'testHeader');
          const cookies = AmfLoader.lookupSecurities(amf, '/cookie', 'get');
          element.security = cookies;
          await nextFrame();
          const headers = AmfLoader.lookupSecurities(amf, '/header', 'get');
          element.security = headers;
          await nextFrame();
          const result = element.serialize();
          assert.equal(result.headers.client_secret, 'testHeader');
        });
      });

      describe('a11y', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
        });

        it('is accessible for custom fields (headers and qp)', async () => {
          const element = await modelFixture(amf, '/junction', 'get');
          await assert.isAccessible(element);
        });
      });

      describe('clear()', () => {
        let factory;
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ compact, fileName });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('clears headers', async () => {
          const element = await modelFixture(amf, '/header', 'get');
          const input = element.shadowRoot.querySelector(`[name="client_secret"]`);
          input.value = 'test';
          input.dispatchEvent(new CustomEvent('input'));
          element.clear();
          const params = element.serialize();
          assert.strictEqual(params.headers.client_secret, '');
        });

        it('clears query parameters', async () => {
          const element = await modelFixture(amf, '/query', 'get');
          const input = element.shadowRoot.querySelector(`[name="client_id"]`);
          input.value = 'test';
          input.dispatchEvent(new CustomEvent('input'));
          element.clear();
          const params = element.serialize();
          assert.strictEqual(params.queryParameters.client_id, '');
        });

        it('clears cookie parameters', async () => {
          const element = await modelFixture(amf, '/cookie', 'get');
          const input = element.shadowRoot.querySelector(`[name="client_secret"]`);
          input.value = 'test';
          input.dispatchEvent(new CustomEvent('input'));
          element.clear();
          const params = element.serialize();
          assert.strictEqual(params.cookies.client_secret, '');
        });
      });
    });
  });
});
