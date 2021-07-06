const utils = require('./utils');

import { strict as assert } from 'assert';
const TizenDriver = require('../lib/driver').TizenDriver;

let driver;

beforeEach(async function setUpTizenDriver () {
  const opts = {
    tizenBackend: 'aurum',
    appPackage: 'org.tizen.elm-demo-tizen-mobile'
  };
  driver = new TizenDriver(opts, true);
  const sessionCaps = {
    platformName: 'tizen',
    deviceName: 'TM1',
    appPackage: 'org.tizen.elm-demo-tizen-mobile'
  };

  return driver.createSession(sessionCaps);
});

describe('Application management', function () {
  beforeEach(async function () {
    await driver.closeApp();
  });

  describe('isStartedApp', function () {
    it('should return "false" when app is not running', async function () {
      let result = await driver.isStartedApp();
      console.log(result);
      assert(typeof result === 'boolean');
      assert(result === false);
    });

    it('should return "true" when app is running', async function () {
      await driver.startApp();
      let result = await driver.isStartedApp();
      assert(typeof result === 'boolean');
      assert(result === true);
    });
  });
});

describe('findElement', function () {

  describe('using "-tizen aurum" strategy', function () {

    it('should support nested selectors', async function () {
      let result = await driver.findElement('-tizen aurum', {
        children: [{
          isClickable: true
        }, {
          isShowing: true
        }]
      });
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it ('should find an array of non-zero elements when no constraint is set', async function () {
      let result = await driver.findElement('-tizen aurum', {/* No constraints */});
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it ('should find an element with a simple single-condition strategy', async function () {
      let result = await driver.findElement('-tizen aurum', {isClickable: true});
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return true;
    });
  });

  describe('using standard JSON Wire Protocol strategies', function () {

    it('should support "id" strategy', async function () {
      const existingId = await driver.findElement('-tizen aurum', {});
      const result = await driver.findElement('id', existingId);
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      assert(existingId === result);
      return;
    });

    it('should support "automationId" strategy', async function () {
      const result = await driver.findElement('automationId', 'TODO');
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it('should support "accessibility id" strategy', async function () {
      // TODO: finish
      const existingId = await driver.findElement('-tizen aurum', {});
      const result = await driver.findElement('accessibility id', 'TODO');
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it('should support "name" strategy', async function () {
      const result = await driver.findElement('name', 'Button');
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it('should support "class name" strategy', async function () {
      const result = await driver.findElement('class name', 'TODO');
      assert(result !== null);
      assert(typeof result === 'string');
      assert(utils.hasOnlyDigits(result));
      return;
    });

    it('should throw NoSuchElementError when element is not found', async function () {
      await driver.findElement('-tizen aurum', {
        elementId: 'Non-existent elementId'
      });
      return;
    });
  });

  describe('using unsupported strategy', function () {

    it('should throw InvalidSelectorError', async function () {
      assert.rejects(
                async function () {
                  return await driver.findElement('Not supported strategy', 'value');
                },
                {
                  name: 'InvalidSelectorError'
                });
      return;
    });
  });
});

