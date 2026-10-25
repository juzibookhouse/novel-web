// Pure display tests: no SDK, database, environment files or network access.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('../src/lib/chapterList.ts', import.meta.url), 'utf8');
const { sortChaptersForDisplay, getChapterListView } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
);
const chapter = (order) => ({ id: `chapter-${order}`, chapter_order: order });

test('both directions sort the full collection by reading order, not title or input position', () => {
  const items = [chapter(10), chapter(2), chapter(7), chapter(1)];
  assert.deepEqual(sortChaptersForDisplay(items, 'asc').map(c => c.chapter_order), [1, 2, 7, 10]);
  assert.deepEqual(sortChaptersForDisplay(items, 'desc').map(c => c.chapter_order), [10, 7, 2, 1]);
});

test('display sorting never mutates shared reading order or chapter references used for editing', () => {
  const items = Object.freeze([Object.freeze(chapter(1)), Object.freeze(chapter(2))]);
  const sorted = sortChaptersForDisplay(items, 'desc');
  assert.deepEqual(items.map(c => c.chapter_order), [1, 2]);
  assert.equal(sorted[0], items[1]);
  assert.notEqual(sorted, items);
});

test('equal chapter orders remain stable; missing or invalid orders stay at the end', () => {
  const items = [chapter(null), { id: 'a', chapter_order: 2 }, { id: 'b', chapter_order: 2 }, chapter(NaN), { id: 'missing' }, chapter(1)];
  assert.deepEqual(sortChaptersForDisplay(items, 'desc').map(c => c.id), ['a', 'b', 'chapter-1', 'chapter-null', 'chapter-NaN', 'missing']);
  assert.deepEqual(sortChaptersForDisplay(items, 'asc').map(c => c.id), ['chapter-1', 'a', 'b', 'chapter-null', 'chapter-NaN', 'missing']);
});

for (const [columns, limit] of [[2, 4], [3, 6]]) {
  for (const count of [0, 1, limit - 1, limit, limit + 1, 25]) {
    test(`${columns} columns: ${count} chapters folds to ${limit}, expands completely, and hides unnecessary toggle`, () => {
      const items = Array.from({ length: count }, (_, i) => chapter(i + 1));
      const folded = getChapterListView(items, false, columns, 2);
      assert.equal(folded.visibleChapters.length, Math.min(count, limit));
      assert.equal(folded.canExpand, count > limit);
      const expanded = getChapterListView(items, true, columns, 2);
      assert.equal(expanded.visibleChapters, items);
      assert.equal(expanded.canExpand, count > limit);
    });
  }

  test(`${columns} columns: sorting keeps either expansion state and chooses globally newest/oldest chapters`, () => {
    const items = Array.from({ length: 21 }, (_, i) => chapter(i + 1));
    for (const expanded of [false, true]) {
      for (const direction of ['asc', 'desc']) {
        const view = getChapterListView(sortChaptersForDisplay(items, direction), expanded, columns, 2);
        assert.equal(view.visibleChapters.length, expanded ? 21 : limit);
        assert.equal(view.visibleChapters[0].chapter_order, direction === 'asc' ? 1 : 21);
      }
    }
  });
}

test('configuration supports a different row count and safe fallback for invalid layout numbers', () => {
  const items = Array.from({ length: 20 }, (_, i) => chapter(i));
  assert.equal(getChapterListView(items, false, 3, 1).visibleChapters.length, 3);
  assert.equal(getChapterListView(items, false, NaN, Infinity).visibleChapters.length, 4);
});

test('large collections render only the collapsed slice and leave source order intact', () => {
  const items = Array.from({ length: 10000 }, (_, i) => chapter(i + 1));
  const sorted = sortChaptersForDisplay(items, 'desc');
  assert.equal(getChapterListView(sorted, false, 3, 2).visibleChapters.length, 6);
  assert.equal(getChapterListView(sorted, true, 3, 2).visibleChapters.length, 10000);
  assert.equal(items[0].chapter_order, 1);
});
