import { fixture, assert, html } from '@open-wc/testing';
import '../api-authorization-method.js';

describe('api-authorization-method', function() {
  async function basicFixture(type) {
    return (await fixture(html`<api-authorization-method
      .type="${type}"
    ></api-authorization-method>`));
  }

  describe('default behavior', () => {
    it('calls default validate()', async () => {
      const element = await basicFixture('basic');
      const result = element.validate();
      assert.isFalse(result);
    });

    it('calls default serialize()', async () => {
      const element = await basicFixture('basic');
      const result = element.serialize();
      assert.deepEqual(result, {
        username: '',
        password: '',
      });
    });

    it('calls default restore()', async () => {
      const element = await basicFixture('basic');
      element.restore({
        username: 'test'
      });
      const result = element.serialize();
      assert.deepEqual(result, {
        username: 'test',
        password: '',
      });
    });
  });
});
