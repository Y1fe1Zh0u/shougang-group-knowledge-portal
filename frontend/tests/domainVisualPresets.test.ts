import test from 'node:test';
import assert from 'node:assert/strict';
import { getDomainVisualPreset } from '../src/utils/domainVisualPresets';

test('configured background image is returned directly', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库1',
      background_image: '/custom-domain.jpg',
    }),
    { backgroundImage: '/custom-domain.jpg' },
  );
});

test('local static path without leading slash is normalized to a site path', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库2',
      background_image: 'rolling-domain-bg.jpg',
    }),
    { backgroundImage: '/rolling-domain-bg.jpg' },
  );
});

test('empty background image means no hardcoded fallback', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库2',
      background_image: '',
    }),
    {},
  );
});
