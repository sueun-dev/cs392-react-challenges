# Remember plan refinement

Baseline: commit `aa9857d` (`Remember the course plan across reloads`).

## Specification prompt

Refactor the existing Remember plan code and make it cleaner without adding features. Keep the saved plan across reloads, keep the time clash rules, and keep the page working when the browser storage is blocked or holds broken data.

## AI use

AI moved the storage code into its own module, made the hook drop saved courses that no longer exist, and wrote the new tests in this revision. I reviewed the code and ran the type check, the linter, and the tests.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Storage code | The key, the parsing, and the try/catch blocks sat inside `useCourseSelection`. | `planStorage.ts` has two functions, `loadPlan` and `savePlan`. | The hook only deals with selection, and the storage rules can be tested alone. |
| Hook setup | The hook defined a loader function and passed it to `useState`. | The hook starts from `loadPlan()` and saves with `savePlan` in one effect line. | Fewer lines in the hook and no storage details in it. |
| Old courses | A saved id stayed in the plan forever, even after its course was deleted. | Saved ids that are not in the course data are dropped on load. | The plan count and the saved data should match what the page shows. |
| Tests | One page test for remembering a plan. | The page tests also check that old ids are dropped, and `planStorage.test.ts` checks empty, saved, broken, mixed, and blocked storage. | Keep the storage rules from drifting. |

## Relevant code comparison

### Before refinement

```ts
const STORAGE_KEY = 'course-plan';

const loadSavedIds = (): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const [selectedIds, setSelectedIds] = useState<string[]>(loadSavedIds);

useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  } catch {
    // Storage unavailable (private mode or quota): the plan just won't persist.
  }
}, [selectedIds]);
```

### After refinement

```ts
// useCourseSelection.ts
const [selectedIds, setSelectedIds] = useState(() =>
  loadPlan().filter(courseId => Object.hasOwn(courses, courseId)));

useEffect(() => savePlan(selectedIds), [selectedIds]);
```

```ts
// planStorage.ts
export const loadPlan = (): string[] => { /* parse safely, [] on any problem */ };
export const savePlan = (courseIds: string[]) => { /* save, ignore a blocked storage */ };
```

The selection and time clash logic did not change.

## Verification

- Type check and lint passed.
- All 70 tests passed.
- I did not check the pruning of old courses in a browser against the live data.

## Known limitations

- The plan is saved only in this browser. It does not follow a signed-in user to another device.
- If the course data changes so that two saved courses now clash, both stay in the plan.
