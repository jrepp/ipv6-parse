'use strict';

const assert = require('assert');
const packageJson = require('../package.json');

const expectedNode = packageJson.devEngines.runtime.version;
const expectedNpm = packageJson.devEngines.packageManager.version;
const npmUserAgent = process.env.npm_config_user_agent || '';
const npmVersion = npmUserAgent.match(/^npm\/([^ ]+)/);

assert.strictEqual(
  process.versions.node,
  expectedNode,
  `Expected Node.js ${expectedNode}, received ${process.versions.node}`
);
assert.ok(npmVersion, 'Unable to determine the npm version from npm_config_user_agent');
assert.strictEqual(
  npmVersion[1],
  expectedNpm,
  `Expected npm ${expectedNpm}, received ${npmVersion[1]}`
);

console.log(`Toolchain regression tests passed with Node.js ${expectedNode} and npm ${expectedNpm}.`);
