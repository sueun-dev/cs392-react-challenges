# Form submission refinement

Baseline: commit `4f6b980` (`Add form submission`).

## Specification prompt

Refactor the existing Form submission code and improve the form's appearance. Keep the Submit behavior and the database write path.

## AI use

AI refined the form component, the submit check, the button styles, and the database write rule in this revision.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Submit condition | `hasErrors` and `hasChanges` were checked in both the handler and the button. | One `canSubmit` value is used by both. | Keep the rule in one place. |
| Field markup | The field markup and its change handler were inline in the form. | A `CourseField` component renders one field and reports changes through `onChange`. | Make the form read as a list of fields and actions. |
| State update | The handler was written inside each input. | One `changeValue` function updates the latest state. | Avoid repeating the update logic. |
| Formatting | The card and form markup were not indented inside their wrappers. | The markup is indented to match its nesting. | Make the structure readable. |
| Cancel button | Cancel and Submit looked the same. | Cancel is a white secondary button. | Make the main action stand out. |
| Disabled Submit | A disabled Submit looked like an enabled one. | A disabled Submit is gray and shows a not-allowed cursor. | Show when saving is not possible. |
| Button spacing | The buttons had no gap and could touch on narrow screens. | The actions have a gap and wrap. | Keep the buttons apart on any width. |
| Database rule | Any write to a course was allowed, including a delete. | A write must contain data. | Block deletes, which skip the field checks. |

## Relevant code comparison

### Before refinement

```tsx
const hasErrors = Object.values(errors).some(Boolean);
const hasChanges = courseFields.some(({ name }) => values[name] !== course[name]);

const submit = (event: FormEvent) => {
  event.preventDefault();
  if (hasErrors || !hasChanges) return;
  updateData(`/courses/${courseId}`, values);
};

<button type="submit" className="action-button" disabled={hasErrors || !hasChanges}>
```

### After refinement

```tsx
const canSubmit = !Object.values(errors).some(Boolean)
  && courseFields.some(({ name }) => values[name] !== course[name]);

const submit = (event: FormEvent) => {
  event.preventDefault();
  if (canSubmit) updateData(`/courses/${courseId}`, values);
};

<button type="submit" className="action-button" disabled={!canSubmit}>
```

```json
".write": true
```

```json
".write": "newData.exists()"
```

The revised form adds one component and one function. The earlier version had fewer components, but the submit rule was written twice and the fields were harder to scan. The data path and the saved fields are unchanged.

## Verification

- Build and lint passed.
- The form was checked in the browser: Cancel is a secondary button, and Submit is gray until a valid change is made.
