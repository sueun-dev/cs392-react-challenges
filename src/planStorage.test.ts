import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPlan, savePlan } from './planStorage';

describe('planStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts with an empty plan when nothing was saved', () => {
    expect(loadPlan()).toEqual([]);
  });

  it('loads the course ids that were saved', () => {
    savePlan(['F101', 'W202']);
    expect(loadPlan()).toEqual(['F101', 'W202']);
  });

  it('treats broken or unexpected data as an empty plan', () => {
    localStorage.setItem('course-plan', '{not json');
    expect(loadPlan()).toEqual([]);
    localStorage.setItem('course-plan', '{"F101":true}');
    expect(loadPlan()).toEqual([]);
  });

  it('keeps only the string ids from a mixed list', () => {
    localStorage.setItem('course-plan', '["F101", 7, null, "W202"]');
    expect(loadPlan()).toEqual(['F101', 'W202']);
  });

  it('treats a saved string, number or null as an empty plan', () => {
    for (const text of ['"F101"', '7', 'null']) {
      localStorage.setItem('course-plan', text);
      expect(loadPlan()).toEqual([]);
    }
  });

  it('does not throw when the storage refuses to save or to load', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is full');
    });
    expect(() => savePlan(['F101'])).not.toThrow();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });
    expect(loadPlan()).toEqual([]);
  });
});
