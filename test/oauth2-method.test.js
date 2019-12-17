import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import {
  oauth2GrantTypes,
} from '@advanced-rest-client/authorization-method/src/Oauth2MethodMixin.js';
import * as MockInteractions from '@polymer/iron-test-helpers/mock-interactions.js';
import '../api-authorization-method.js';

describe('OAuth 2', function() {
  async function basicFixture(amf, security) {
    return (await fixture(html`<api-authorization-method
      type="oauth 2"
      .amf="${amf}"
      .security="${security}"
    ></api-authorization-method>`));
  }

  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurity(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout();
    return element;
  }

  [
    ['Full model', false],
    ['Compact model', true]
  ].forEach(([label, compact]) => {
    describe(label, () => {
      describe('initialization', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load({ compact });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('can be initialized with document.createElement', () => {
          const element = document.createElement('api-authorization-method');
          assert.ok(element);
        });

        it('can be initialized in a template with model', async () => {
          const security = AmfLoader.lookupSecurity(amf, '/oauth2', 'post');
          const element = await basicFixture(amf, security);
          await aTimeout();
          assert.ok(element);
        });

        it('can be initialized in a template without the model', async () => {
          const element = await basicFixture();
          await aTimeout();
          assert.ok(element);
        });
      });

      describe('setting API data', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load({ compact });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('sets default authorization grants', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.deepEqual(element.grantTypes, oauth2GrantTypes);
        });

        it('sets API defined grant types', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          assert.deepEqual(element.grantTypes, [{
            type: 'authorization_code',
            label: 'Authorization code (server flow)'
          }]);
        });

        it('changes grant types list when endpoint changes', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          const security = AmfLoader.lookupSecurity(amf, '/oauth2', 'post');
          element.security = security;
          await nextFrame();
          assert.deepEqual(element.grantTypes, oauth2GrantTypes);
        });

        it('selects first available grant type', async () => {
          const element = await modelFixture(amf, '/oauth2-with-grant-list', 'get');
          assert.equal(element.grantType, 'authorization_code');
        });

        it('sets authorizationUri', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.equal(element.authorizationUri, 'https://auth.com');
        });

        it('sets accessTokenUri', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.equal(element.accessTokenUri, 'https://token.com');
        });

        it('sets scopes', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          assert.deepEqual(element.scopes, ['profile', 'email']);
        });

        it('automatically hides advanced properties when filled', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          const node = element.shadowRoot.querySelector('.advanced-section');
          assert.isTrue(node.hasAttribute('hidden'));
        });

        it('does not render annotation inputs when are not defined', async () => {
          const element = await modelFixture(amf, '/oauth2', 'post');
          const node = element.shadowRoot.querySelector('.custom-data-field');
          assert.notOk(node);
        });

        it('renders annotation inputs when defined', async () => {
          const element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
          const nodes = element.shadowRoot.querySelectorAll('.custom-data-field');
          assert.lengthOf(nodes, 10);
        });

        it('sets oauthDeliveryMethod to header when available', async () => {
          const element = await modelFixture(amf, '/oauth2-header-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'header');
          assert.equal(element.oauthDeliveryName, 'token');
        });

        it('sets oauthDeliveryMethod to query when available', async () => {
          const element = await modelFixture(amf, '/oauth2-query-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'query');
          assert.equal(element.oauthDeliveryName, 'access_token');
        });

        it('sets default oauthDeliveryMethod', async () => {
          const element = await modelFixture(amf, '/oauth2-no-delivery', 'get');
          assert.equal(element.oauthDeliveryMethod, 'header');
          assert.equal(element.oauthDeliveryName, 'authorization');
        });

        it('resets state when incompatible settings', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          assert.deepEqual(element.grantTypes, oauth2GrantTypes, 'grant types are set');
          assert.equal(element.oauthDeliveryMethod, 'header', 'oauthDeliveryMethod is set');
          assert.equal(element.oauthDeliveryName, 'authorization', 'oauthDeliveryName is set');
        });
      });

      describe('annotation data changing', () => {
        let amf;
        let factory;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ compact });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
          element.grantType = 'authorization_code';
          await nextFrame();
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('updates query parameter on authorization request', async () => {
          const input = element.shadowRoot.querySelector('api-property-form-item[name="numericParam"]');
          input.value = 10;
          const info = element.serialize();
          assert.equal(info.customData.auth.parameters[1].value, '10');
        });

        it('updates array value', async () => {
          const input = element.shadowRoot.querySelector('api-property-form-item[name="repetableParam1"]');
          input.value = ['test'];
          input.dispatchEvent(new CustomEvent('value-changed', {
            detail: {
              value: ['test']
            }
          }));
          await nextFrame();
          const info = element.serialize();
          assert.deepEqual(info.customData.auth.parameters[1].value, ['test']);
        });

        it('updates query parameter on token request', async () => {
          const input = element.shadowRoot.querySelector('api-property-form-item[name="queryTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.equal(info.customData.token.parameters[0].value, 'test');
        });

        it('updates header on token request', async () => {
          const input = element.shadowRoot.querySelector('api-property-form-item[name="x-token-resource"]');
          input.value = '123';
          const info = element.serialize();
          assert.equal(info.customData.token.headers[0].value, '123');
        });

        it('updates header on token request', async () => {
          const input = element.shadowRoot.querySelector('api-property-form-item[name="bodyTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.equal(info.customData.token.body[0].value, 'test');
        });
      });

      describe('serialize()', () => {
        let amf;
        let factory;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ compact });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('serializes implicit data', async () => {
          element.grantType = 'implicit';
          await nextFrame();
          const info = element.serialize();
          assert.typeOf(info.customData.auth.parameters, 'array');
          assert.lengthOf(info.customData.auth.parameters, 1);
        });

        it('has not token properties for implicit data', async () => {
          element.grantType = 'implicit';
          await nextFrame();
          const info = element.serialize();
          assert.isUndefined(info.customData.token.parameters);
          assert.isUndefined(info.customData.token.headers);
          assert.isUndefined(info.customData.token.body);
        });

        it('serializes authorization code data', async () => {
          element.grantType = 'authorization_code';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-property-form-item[name="queryTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });

        it('serializes client credentials data', async () => {
          element.grantType = 'client_credentials';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-property-form-item[name="queryTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });

        it('serializes password data', async () => {
          element.grantType = 'password';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-property-form-item[name="queryTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });

        it('serializes custom grant data', async () => {
          element.grantType = 'annotated_custom_grant';
          await nextFrame();
          const input = element.shadowRoot.querySelector('api-property-form-item[name="queryTokenResource"]');
          input.value = 'test';
          const info = element.serialize();
          assert.typeOf(info.customData.token.parameters, 'array');
          assert.lengthOf(info.customData.token.parameters, 1);
        });
      });

      describe('documentation rendering', () => {
        let amf;
        let factory;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ compact });
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth2-with-annotations', 'get');
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('does not render documentation items by default', () => {
          const node = element.shadowRoot.querySelector('.custom-data-field .docs-container');
          assert.notOk(node);
        });

        it('renders documentation when activated', async () => {
          const button = element.shadowRoot.querySelector('.custom-data-field .hint-icon');
          MockInteractions.tap(button);
          await nextFrame();
          const node = element.shadowRoot.querySelector('.custom-data-field .docs-container');
          assert.ok(node);
        });
      });
    });
  });
});
