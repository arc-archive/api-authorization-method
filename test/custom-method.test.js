import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import * as sinon from 'sinon';
import * as MockInteractions from '@polymer/iron-test-helpers/mock-interactions.js';
import '../api-authorization-method.js';

describe.only('RAML custom scheme', function() {
  async function basicFixture(amf, security) {
    return (await fixture(html`<api-authorization-method
      type="custom"
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

  const apiFile = 'custom-schemes-api';

  [
    ['Full model', false],
    ['Compact model', true]
  ].forEach(([label, compact]) => {
    describe(label, () => {
      describe('initialization', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load(apiFile, compact);
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('can be initialized with document.createElement', () => {
          const element = document.createElement('auth-method-custom');
          assert.ok(element);
        });

        it('can be initialized in a template with model', async () => {
          const security = AmfLoader.lookupSecurity(amf, '/custom2', 'get');
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

      describe('content rendering', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load(apiFile, compact);
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('renders headers', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item[data-type="header"]`);
          assert.lengthOf(nodes, 1);
        });

        it('renders query parameters', async () => {
          const element = await modelFixture(amf, '/custom2', 'get');
          const nodes = element.shadowRoot.querySelectorAll(`api-property-form-item[data-type="query"]`);
          assert.lengthOf(nodes, 2);
        });

        it('renders scheme title', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const node = element.shadowRoot.querySelector(`.subtitle`);
          const result = node.textContent.trim();
          assert.equal(result, 'Scheme: custom1');
        });

        it('renders scheme dosc toggle button', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const node = element.shadowRoot.querySelector(`.subtitle .hint-icon`);
          assert.ok(node);
        });
      });

      describe('description rendering', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load(apiFile, compact);
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('does not render scheme description by default', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const node = element.shadowRoot.querySelector(`.subtitle`);
          const next = node.nextElementSibling;
          assert.equal(next.localName, 'form');
        });

        it('renders scheme description after activation', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const button = element.shadowRoot.querySelector(`.subtitle .hint-icon`);
          MockInteractions.tap(button);
          await nextFrame();
          const node = element.shadowRoot.querySelector(`.subtitle`);
          const next = node.nextElementSibling;
          assert.isTrue(next.classList.contains('docs-container'));
        });

        it('does not render field description by default', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const node = element.shadowRoot.querySelector(`.field-value`);
          const next = node.nextElementSibling;
          assert.isFalse(next.classList.contains('docs-container'));
        });

        it('renders field description after activation', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const node = element.shadowRoot.querySelector(`.field-value`);
          const button = node.querySelector('.hint-icon');
          MockInteractions.tap(button);
          await nextFrame();
          const next = node.nextElementSibling;
          assert.isTrue(next.classList.contains('docs-container'));
        });
      });

      describe('change notification', () => {
        let amf;
        let factory;

        before(async () => {
          amf = await AmfLoader.load(apiFile, compact);
          factory = document.createElement('api-view-model-transformer');
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('notifies when value change', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const input = element.shadowRoot.querySelector(`[name="SpecialTokenHeader"]`);
          input.value = 'test';
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          input.dispatchEvent(new CustomEvent('input'));
          assert.isTrue(spy.called);
        });

        it('notifies when selection change', async () => {
          const element = await modelFixture(amf, '/custom1', 'get');
          const input = element.shadowRoot.querySelector(`[name="debugTokenParam"]`);
          const option = input.shadowRoot.querySelector(`[data-value="Log"]`);
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          MockInteractions.tap(option);
          assert.isTrue(spy.called);
        });

        it('notifies when AMF model change', async () => {
          const security = AmfLoader.lookupSecurity(amf, '/custom1', 'get');
          const element = await basicFixture(amf);
          element.security = security;
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          await aTimeout();
          assert.isTrue(spy.called);
        });
      });
    });
  });
});
