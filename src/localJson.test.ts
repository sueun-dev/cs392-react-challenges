import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson } from './localJson';

describe('localJson', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('reads null when nothing was saved under the key', () => {
    expect(readJson('missing')).toBeNull();
  });

  it('reads back what was written, whatever its shape', () => {
    writeJson('list', ['a', 1]);
    writeJson('object', { a: { b: true } });
    expect(readJson('list')).toEqual(['a', 1]);
    expect(readJson('object')).toEqual({ a: { b: true } });
  });

  it('keeps separate keys apart and overwrites the same key', () => {
    writeJson('one', 1);
    writeJson('two', 2);
    writeJson('one', 3);
    expect(readJson('one')).toBe(3);
    expect(readJson('two')).toBe(2);
  });

  it('reads undefined when the saved text is not valid JSON', () => {
    localStorage.setItem('broken', '{not json');
    expect(readJson('broken')).toBeUndefined();
  });

  it('does not throw when the storage refuses to save or to load', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is full');
    });
    expect(() => writeJson('key', 1)).not.toThrow();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });
    expect(readJson('key')).toBeUndefined();
  });
});
