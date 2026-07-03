jest.mock('amplitude-js', () => ({
  init: jest.fn(),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  getInstance: jest.fn(() => ({ init: jest.fn(), logEvent: jest.fn() }))
}));
jest.mock('history', () => ({
  createBrowserHistory: jest.fn(() => ({
    location: { pathname: '/' },
    listen: jest.fn(),
    replace: jest.fn(),
    push: jest.fn()
  }))
}));

import { errToString, imageHasTag } from '../Util.js';

describe('errToString', () => {
  test('returns "null" for null input', () => {
    expect(errToString(null)).toBe('null');
  });

  test('returns the string itself for string input', () => {
    expect(errToString('something broke')).toBe('something broke');
  });

  test('returns message from Error object', () => {
    expect(errToString(new Error('oops'))).toBe('oops');
  });

  test('includes type prefix when present', () => {
    const err = { type: 'NetworkError', message: 'timeout' };
    expect(errToString(err)).toBe('(type: NetworkError) timeout');
  });

  test('returns message without prefix when type is absent', () => {
    const err = { message: 'just a message' };
    expect(errToString(err)).toBe('just a message');
  });

  test('falls back to toLocaleString', () => {
    const obj = { toLocaleString: () => 'locale-string' };
    expect(errToString(obj)).toBe('locale-string');
  });

  test('falls back to toString when no message or toLocaleString', () => {
    // Numbers have toString but no message
    expect(errToString(42)).toBe('42');
  });
});

describe('imageHasTag', () => {
  test('returns true when image has the tag', () => {
    const img = { tags: ['blue', 'white', 'gray'] };
    expect(imageHasTag(img, 'blue')).toBe(true);
  });

  test('returns false when image does not have the tag', () => {
    const img = { tags: ['blue', 'white'] };
    expect(imageHasTag(img, 'gray')).toBe(false);
  });

  test('returns false for null/undefined image', () => {
    expect(imageHasTag(null, 'blue')).toBe(false);
    expect(imageHasTag(undefined, 'blue')).toBe(false);
  });

  test('handles image with null tags (initializes to empty array)', () => {
    const img = { tags: null };
    expect(imageHasTag(img, 'blue')).toBe(false);
    // side effect: tags is now []
    expect(img.tags).toEqual([]);
  });

  test('handles image with no tags property', () => {
    const img = {};
    expect(imageHasTag(img, 'blue')).toBe(false);
  });

  test('handles empty tags array', () => {
    const img = { tags: [] };
    expect(imageHasTag(img, 'blue')).toBe(false);
  });
});
