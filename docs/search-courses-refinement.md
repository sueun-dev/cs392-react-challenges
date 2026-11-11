# Search courses refinement

Baseline: commit `226e188` (`Add course search to the term page`).

## Specification prompt

Make the course search more capable for a course planning app. Forgive small typing mistakes, accept course numbers written as `214`, `cs214` or `CS 214`, let students search by the day a course meets, list the best match first, and show how many courses match. Keep the search inside the selected term, and keep the selected courses and the time conflict marks unchanged while the list is filtered.

## AI use

AI proposed the scoring approach, wrote the edit distance function and the new search module, added the result count to the search box, and wrote the new tests in this revision. I reviewed the code, ran the type check, the linter, and the tests, and chose the typing-mistake limits.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Matching | A course matched when every typed word appeared as plain text in its number or title. | Every typed word must match the course number, a word of the title, or a day the course meets. | Students search for a topic, a number, or a day, and each is one kind of match. |
| Typing mistakes | `comptuing` or `progrmaing` found nothing. | Missing, extra, wrong, and swapped neighbouring letters are forgiven. Words of 3 letters or fewer must be exact, words of 4 or 5 letters may differ by 1 edit, and longer words by 2. | A typo should not hide a course, but a short word has too many near neighbours to guess. |
| Partial words | A typed fragment matched anywhere inside the text. | A fragment is compared with the start of each title word, so `compting` still finds `Computing` while it is being typed. | The list should keep up with typing. |
| Course numbers | Only the digits of the number matched. | `214`, `cs214`, and `CS 214` all mean the number 214, and a bare `cs` matches everything. | Students write the course name in several ways. |
| Text cleanup | Case was ignored, but accents and punctuation were not. | Case, accents, and punctuation are ignored. | `Café` and `cafe` should be the same word. |
| Days | Not searchable. | `tuesday`, `thu`, and similar words match courses that meet on that day. A course with no readable time never matches a day. | Students plan around the days they are free. |
| Order | Matches kept the order of the data. | Whole-word and exact-number matches come first, then prefix matches, then typo matches. Equal matches keep their original order, and an empty search keeps the full original order. | The most likely course should be at the top. |
| Feedback | An empty-result message only. | The search box also shows "N of M courses match" while a search is active. | Students can see how much the search narrowed the list. |
| Tests | 54 tests. | 63 tests. The new search tests cover the edit distance, each kind of match, ordering, and the page. | Keep the matching rules from drifting. |

## Relevant code comparison

### Before refinement

```ts
// courseSearch.ts
export const matchesQuery = (course: Course, query: string) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${course.number} ${course.title}`.toLowerCase();
  return words.every(word => text.includes(word));
};
```

### After refinement

```ts
// courseSearch.ts
const allowedEdits = (length: number) => {
  if (length < minimumFuzzyLength) return 0;
  return length < 6 ? 1 : 2;
};

export const scoreCourse = (course: Course, query: string): number | null => {
  const tokens = queryTokens(query);
  const candidate = toCandidate(course);
  let total = 0;

  for (const token of tokens) {
    const score = scoreToken(token, candidate);
    if (score === null) return null;
    total += score;
  }
  return total;
};
```

```tsx
// App.tsx
const matchingCourses = filterCourses(visibleCourses, searchQuery);

<CourseSearch value={searchQuery} resultCount={matchingCourses.length}
  totalCount={visibleCourses.length} onChange={setSearchQuery} />
```

The search rules live in one module and are pure functions, so the page only passes in the text and the courses. The clash marks are still computed from every course of the term, not from the filtered list.

## Verification

- Type check and lint passed.
- All 63 tests passed.
- I did not look at the new count line and placeholder at narrow widths in a browser for this revision.

## Known limitations

- The search covers only the selected term. A course in another term cannot be found from the current tab.
- The typing-mistake limits are fixed numbers that I chose by hand. Titles with many similar short words could produce an unexpected match.
- The search reads days from the meeting text, so a course whose time is not written in the usual form cannot be found by day.
