# Time conflicts refinement

Baseline: commit `ca77c05` (`Add time conflict checks`).

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Unavailable cards | The entire card used 40% opacity. | Readable muted text, a dashed border, and a Time conflict label. | Explain why the card cannot be selected without fading its content. |
| Hover | Every card received the hover border. | Only enabled cards receive that hover treatment. | Avoid suggesting that unavailable cards can be selected. |
| Selection guidance | No instructions beside the list. | A short line explains selection and removal. | Make the interaction easier to discover. |
| Course plan button | Course plan. | Course plan followed by the selected-course count. | Show the current selection total across terms. |

## Relevant code comparison

### Before refinement

```tsx
className="course-card flex w-full flex-col text-left disabled:opacity-40"

<p className="course-meeting mt-5 pt-3">{course.meets}</p>
```

### After refinement

```tsx
className="course-card flex w-full flex-col text-left"

<div className="course-meeting mt-5 pt-3">
  <p>{course.meets}</p>
  {hasClash && <p className="course-conflict">Time conflict</p>}
</div>
```

```css
.course-card:disabled {
  border-style: dashed;
  background: #f1eef3;
  color: var(--muted);
  cursor: not-allowed;
}

.course-conflict {
  margin-top: 0.5rem;
  color: #8a3418;
  font-size: 0.8rem;
  font-weight: 600;
}
```

The revised version adds a few presentation rules and a text label. The earlier
version is shorter, but opacity alone does not explain why a card is unavailable.
