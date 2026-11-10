# Role-based authorization refinement

Baseline: commit `3b52690` (`Add role-based authorization`).

## Specification prompt

Refactor the existing role-based authorization code, make it clear to each kind of visitor what they can and cannot do, and test it. Keep the admin list in the database, the admin-only write rule, and the Edit buttons that only admins see. Keep the visual change small.

## AI use

AI refined the data hook, the editor state, the role feedback in the header, and the tests in this revision.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Data hook | `useDataQuery` kept `data`, `isLoading`, and `error` in three states. After the path changed it kept returning the previous path's data until the new value arrived. | The hook keeps one result tagged with its path. A result for another path counts as loading. | A user who signs out or switches accounts must not keep the previous user's admin flag, even for a moment. |
| Admin check | `Boolean(user) && adminFlag === true`. | `user != null && adminFlag === true`. | Says directly what is meant. |
| Role feedback | A signed-in user who is not an admin saw nothing different and no reason why the Edit buttons were missing. | The header shows an Administrator or View only label next to the name. | The user can see which role the page gave them. |
| Access hint | None. | The hint line under the toolbar says who can edit: signed-out visitors are told administrators can sign in, and signed-in non-admins are told only administrators can edit. Admins see no extra text. | Explains the missing Edit buttons in plain words and tells the visitor what to do next. |
| Editor state | The editor opened when `isAdmin` and `editingCourseId` were set, and the id stayed set after the user lost admin rights. | The page picks the course to edit only for admins, closes the editor when admin rights are lost, and clears the id. | The editor does not come back by itself when the same person signs in as an admin later, and a missing course cannot crash the page. |
| Layout | The loading message was one long line. | The loading check is split across lines. | Easier to read. |
| Tests | `App.test.tsx` covered the visibility of the Edit buttons by role. | `App.test.tsx` also covers the role label, both hints, and closing the editor when admin rights are lost. A new `firebase.test.tsx` covers the data hook (loading, error, path change) and the admin hook (admin, non-admin, signed out, sign out). | Keep the behavior from breaking. |

## Relevant code comparison

### Before refinement

```ts
export const useDataQuery = (path: string): DataQuery => {
  const [data, setData] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => onValue(ref(database, path),
    snapshot => {
      setData(snapshot.val());
      setIsLoading(false);
    },
    queryError => {
      setError(queryError);
      setIsLoading(false);
    }
  ), [path]);

  return [data, isLoading, error];
};
```

```tsx
if (isAdmin && editingCourseId !== null) {
  return <CourseForm courseId={editingCourseId} course={schedule.courses[editingCourseId]}
    onCancel={() => setEditingCourseId(null)} />;
}
```

### After refinement

```ts
export const useDataQuery = (path: string): DataQuery => {
  const [result, setResult] = useState<QueryResult>();

  useEffect(() => onValue(ref(database, path),
    snapshot => setResult({ path, data: snapshot.val() }),
    queryError => setResult({ path, error: queryError })
  ), [path]);

  const isCurrent = result?.path === path;
  return [isCurrent ? result.data : undefined, !isCurrent, isCurrent ? result.error : undefined];
};
```

```tsx
if (!isAdmin && editingCourseId !== null) setEditingCourseId(null);

const editingCourse = isAdmin && editingCourseId !== null
  ? schedule.courses[editingCourseId]
  : undefined;
if (editingCourseId !== null && editingCourse) {
  return <CourseForm courseId={editingCourseId} course={editingCourse}
    onCancel={() => setEditingCourseId(null)} />;
}
```

The revised code adds one test file, one small component label, and one hint function. The database rules, the data paths, and the admin entry are unchanged.

## Verification

- Type check, lint, and build passed.
- The 18 tests in `App.test.tsx` and `firebase.test.tsx` passed. With the old `useDataQuery`, the test that changes the path fails, so it does catch the problem this revision fixes.
- I looked at the page as an administrator, a signed-in non-admin, and a signed-out visitor, at desktop width and at 375 px. These views used a local copy of the page with a stand-in for the sign-in and the database. There was no horizontal scrolling at 375 px.

## Known limitation

The root of the database is readable by everyone, because the course page reads the whole database. That also makes the list of admin IDs readable. Writes are still limited to admins by the rules. Hiding the list would mean reading only the course data and the user's own admin entry.
