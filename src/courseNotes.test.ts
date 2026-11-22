import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepExistingNotes, loadNotes, noteMaxLength, saveNotes, withNote } from './courseNotes';

describe('courseNotes storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts with no notes when nothing was saved', () => {
    expect(loadNotes()).toEqual({});
  });

  it('loads the notes that were saved', () => {
    saveNotes({ f101: 'Ask about the project', w202: 'Hard to get into' });
    expect(loadNotes()).toEqual({ f101: 'Ask about the project', w202: 'Hard to get into' });
  });

  it('treats broken or unexpected data as no notes', () => {
    localStorage.setItem('course-notes', '{not json');
    expect(loadNotes()).toEqual({});
    localStorage.setItem('course-notes', '["f101"]');
    expect(loadNotes()).toEqual({});
    localStorage.setItem('course-notes', 'null');
    expect(loadNotes()).toEqual({});
  });

  it('keeps only the non-empty string notes from a mixed object', () => {
    localStorage.setItem('course-notes', '{"f101":"keep","f102":7,"f103":null,"f104":""}');
    expect(loadNotes()).toEqual({ f101: 'keep' });
  });

  it('cuts a saved note that is longer than the limit', () => {
    saveNotes({ f101: 'x'.repeat(noteMaxLength + 50) });
    expect(loadNotes().f101).toHaveLength(noteMaxLength);
  });

  it('treats a saved string or number as no notes', () => {
    localStorage.setItem('course-notes', '"f101"');
    expect(loadNotes()).toEqual({});
    localStorage.setItem('course-notes', '7');
    expect(loadNotes()).toEqual({});
  });

  it('does not throw when the storage refuses to save or to load', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is full');
    });
    expect(() => saveNotes({ f101: 'note' })).not.toThrow();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });
    expect(loadNotes()).toEqual({});
  });
});

describe('withNote', () => {
  it('adds a note and replaces an existing one without touching the others', () => {
    const notes = { f101: 'first' };
    expect(withNote(notes, 'f102', 'second')).toEqual({ f101: 'first', f102: 'second' });
    expect(withNote(notes, 'f101', 'changed')).toEqual({ f101: 'changed' });
    expect(notes).toEqual({ f101: 'first' });
  });

  it('removes the note when the text becomes empty', () => {
    expect(withNote({ f101: 'first', f102: 'second' }, 'f101', '')).toEqual({ f102: 'second' });
  });

  it('leaves the notes alone when an empty text clears a course that has no note', () => {
    const notes = { f101: 'first' };
    expect(withNote(notes, 'f102', '')).toEqual({ f101: 'first' });
  });

  it('does not change the notes it was given when it removes one', () => {
    const notes = { f101: 'first', f102: 'second' };
    withNote(notes, 'f101', '');
    expect(notes).toEqual({ f101: 'first', f102: 'second' });
  });

  it('keeps a note that is exactly at the limit', () => {
    const exact = 'x'.repeat(noteMaxLength);
    expect(withNote({}, 'f101', exact).f101).toBe(exact);
  });

  it('cuts a note that is longer than the limit', () => {
    const long = 'x'.repeat(noteMaxLength + 20);
    expect(withNote({}, 'f101', long).f101).toHaveLength(noteMaxLength);
  });
});

describe('keepExistingNotes', () => {
  it('drops notes for courses that no longer exist', () => {
    const course = { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro' };
    expect(keepExistingNotes({ f101: 'keep', gone: 'drop' }, { f101: course }))
      .toEqual({ f101: 'keep' });
  });

  it('does not treat inherited object keys as existing courses', () => {
    expect(keepExistingNotes({ toString: 'drop', constructor: 'drop' }, {})).toEqual({});
  });

  it('returns no notes when there are no courses', () => {
    expect(keepExistingNotes({ f101: 'drop' }, {})).toEqual({});
  });
});
