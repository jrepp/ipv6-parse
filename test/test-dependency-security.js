'use strict';

const assert = require('assert');
const packageLock = require('../package-lock.json');

// If these transitive dependencies are present, keep their resolved versions
// above every vulnerability known when this test was added.
const minimumSafeVersions = {
  ajv: '6.14.0',
  'brace-expansion': '1.1.18',
  flatted: '3.4.2',
  'js-yaml': '4.3.1',
  minimatch: '3.1.4'
};

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

for (const dependency of Object.keys(minimumSafeVersions)) {
  const minimumVersion = minimumSafeVersions[dependency];
  const installedVersions = Object.entries(packageLock.packages)
    .filter(([packagePath]) => packagePath.endsWith(`node_modules/${dependency}`))
    .map(([, metadata]) => metadata.version);

  for (const installedVersion of installedVersions) {
    assert.ok(
      compareVersions(installedVersion, minimumVersion) >= 0,
      `${dependency} ${installedVersion} is vulnerable; require ${minimumVersion} or newer`
    );
  }
}

console.log('Dependency security regression tests passed.');
