# Add a database refinement

Baseline: commit `cd60ea9` (`Add a database`).

## Specification prompt

Refactor the existing Add a database code and make it more consistent. Keep the loading and error messages and the way the course data is read.

## AI use

AI refined the data hook, the schedule check, and the loading and error rendering in this revision.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Hook setup | The Firebase app and the database were kept in two constants. | The database is created in one expression. | The app object is not used anywhere else. |
| Hook result | The return type was written inline. | A named `DataQuery` tuple labels data, loading, and error. | Make the result easier to read at the call site. |
| Hook state | The loading state was named `loading`. | It is named `isLoading`, matching the caller. | Use one name for one value. |
| Effect | The effect returned the unsubscribe function from a block body. | The effect returns the `onValue` result directly. | Remove a block that only returned a value. |
| Schedule check | Only checked that `title` and `courses` existed. | Also checks that `title` is a string and `courses` is an object. | Reject data that has the right keys but the wrong shape. |
| Status pages | Loading and error pages repeated the same markup. | A `PageMessage` component renders both. | Keep the markup in one place. |
| Render order | A combined condition decided between error and loading. | Loading is checked first, then the error or invalid data. | Each state has one clear condition. |

## Relevant code comparison

### Before refinement

```tsx
const isSchedule = (data: unknown): data is Schedule =>
  typeof data === 'object' && data !== null && 'title' in data && 'courses' in data;

if (queryError || (!isLoading && !isSchedule(schedule))) {
  return <main className="course-page"><p role="alert">Could not load courses.</p></main>;
}
if (isLoading || !isSchedule(schedule)) {
  return <main className="course-page"><p role="status">Loading courses...</p></main>;
}
```

### After refinement

```tsx
const isSchedule = (data: unknown): data is Schedule =>
  typeof data === 'object' && data !== null
  && 'title' in data && typeof data.title === 'string'
  && 'courses' in data && typeof data.courses === 'object' && data.courses !== null;

if (isLoading) return <PageMessage role="status">Loading courses...</PageMessage>;
if (queryError || !isSchedule(schedule)) {
  return <PageMessage role="alert">Could not load courses.</PageMessage>;
}
```

The revised version adds a small component and a longer type check. The earlier version has fewer lines, but the repeated markup and the combined condition are harder to follow. The messages and the data path are unchanged.

## Verification

- Build and lint passed.
- The public site still needs the course data in the database and read rules before it can be checked.
