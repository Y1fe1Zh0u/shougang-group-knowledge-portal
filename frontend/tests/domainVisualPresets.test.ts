import test from 'node:test';
import assert from 'node:assert/strict';
import { getDomainVisualPreset } from '../src/utils/domainVisualPresets';

test('configured background image overrides demo presets', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库1',
      background_image: '/custom-domain.jpg',
    }),
    { backgroundImage: '/custom-domain.jpg' },
  );
});

test('库1 and 库2 fall back to demo background images', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库1',
      background_image: '',
    }),
    { backgroundImage: '/rolling-domain-bg.jpg' },
  );
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库2',
      background_image: '',
    }),
    { backgroundImage: '/cold-domain-bg.jpg' },
  );
});

test('other demo domains can fall back to logo images', () => {
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库3',
      background_image: '',
    }),
    { logoImage: '/site-logo.png' },
  );
  assert.deepEqual(
    getDomainVisualPreset({
      name: '库4',
      background_image: '',
    }),
    { logoImage: '/shougang-stock-logo.png' },
  );
});
