# Calendar view refinement

Baseline: commit `956d413` (`Add weekly calendar view to the course plan`).

## Specification prompt

Refactor the whole app so it reads like professional code, without changing how it looks or what it does for the user. Split the large file into small modules, remove duplicated logic, fix the weak spots in the time handling, and cover the pure logic with tests. Keep the visual change small.

## AI use

AI proposed the module split, merged the three copies of the meeting-time parsing into one module, rewrote the calendar layout rule, and wrote the new tests in this revision. I reviewed each file, ran the checks, and looked at the page at desktop width and at 375 px.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| File layout | `App.tsx` held 400 lines: the page, the cards, the form, the validation rules, the plan dialog, and the sign-in controls. | `App.tsx` holds the page only (90 lines). Each component has its own file in `src/components`. The course types, the meeting parser, the form rules, and the selection logic each have their own module in `src`. | Each file has one job and can be read and tested alone. |
| Meeting-time parsing | Three separate parsers: `timeConflicts.js` for clashes, `parseMeeting` in `calendar.ts` for the calendar, and a regular expression in the form validator. | One module, `meetings.ts`. `readMeeting` reads a meeting as written, `parseMeeting` reads it as it takes place, and the validator and the clash check both use them. | A rule such as "3:30 means the afternoon" now lives in one place. |
| Time clash check | Untyped JavaScript with a hand-written declaration file. It treated `TuTh 3:30-4:50` as a morning class and threw an error on text such as `TBA`. | TypeScript. Afternoon times written on a 12-hour clock are read as the afternoon, and a course without a readable time never clashes and never throws. | Removes a known wrong result and a possible crash. |
| Selection logic | Selection, conflict marking, and the guard against picking a clashing course sat inside `TermPage`. A selected course that disappeared from the data would crash the page. | `useCourseSelection` returns the selected ids, the planned courses, a blocked check, and a toggle. Selected ids with no matching course are skipped. | `TermPage` only lays out the page, and a data change cannot break it. |
| Segmented buttons | `TermSelector` was a component. The List / Calendar switch repeated its markup and styles under a different name. | One `SegmentedControl` serves both, and the term list comes from one constant. | One control, one set of styles. |
| Plan dialog | Three `courses.length` checks and two view checks, spread over the markup. | One empty-state branch, then one choice between `WeekCalendar` and `PlanList`. | The states are easier to follow. |
| Calendar types | `CalendarCourse` copied the `Course` type. Days were called `key` in the calendar and `days` elsewhere. | The calendar uses `Course` and the shared `DayCode`. Courses that meet only on a weekend are listed in the "No meeting time to show" note instead of disappearing. | One definition per idea, and no course is silently dropped. |
| Narrow calendar | A viewport media query hid the time and the "CS" prefix at 480 px. A window slightly wider than that clipped the time inside short blocks. | A container query on the calendar hides them when the calendar itself is narrower than 34 rem. Block text no longer wraps. | The dialog width, not the screen width, decides what fits. |
| Entry file | `main.tsx` used a different style from the rest of the code. | Same style as the rest, and the import has no file extension. | Consistency. |
| Tests | 35 tests covered the sign-in flow, the data hooks, the parser, and the calendar. | 47 tests. New files cover the meeting parser and clash check, the form rules, and the selection flow in the page. | Keep the new boundaries from breaking. |

## Relevant code comparison

### Before refinement

```js
// timeConflicts.js
const readMeeting = meeting => {
  const [dayText, clockText] = meeting.split(' ');
  const [start, end] = clockText.split('-').map(toClockMinutes);
  return { days: dayText.match(/[A-Z][a-z]*/g) ?? [], start, end };
};
```

```tsx
// App.tsx
const clashingCourseIds = visibleCourses
  .filter(([courseId, course]) => {
    if (selectedCourses.includes(courseId)) return false;
    return plannedCourses.some(([, pickedCourse]) => hasTimeClash(course, pickedCourse));
  })
  .map(([courseId]) => courseId);
```

### After refinement

```ts
// meetings.ts
export const hasTimeClash = (courseA, courseB) => {
  if (courseA.term !== courseB.term) return false;

  const meetingA = parseMeeting(courseA.meets);
  const meetingB = parseMeeting(courseB.meets);
  if (!meetingA || !meetingB) return false;

  const shareDay = meetingA.days.some(day => meetingB.days.includes(day));
  return shareDay && meetingA.start < meetingB.end && meetingB.start < meetingA.end;
};
```

```tsx
// App.tsx
const { selectedIds, plannedCourses, isBlocked, toggleCourse } = useCourseSelection(schedule.courses);
const clashingIds = visibleCourses
  .filter(([courseId, course]) => isBlocked(courseId, course))
  .map(([courseId]) => courseId);
```

```css
.week-calendar {
  container-type: inline-size;
}

@container (max-width: 34rem) {
  .week-prefix,
  .week-time {
    display: none;
  }
}
```

The revised version has more files, but each is short and none repeats another. The page, the data, the Firebase rules, and the visible design are unchanged.

## Verification

- Type check, lint, and build passed.
- All 47 tests passed.
- I looked at the plan dialog with four selected courses at 1000 px, 690 px, 520 px, and 375 px. The time shows when the calendar is wider than 34 rem, no block text is clipped at any of these widths, and the page does not scroll sideways at 375 px.

## Known limitations

- The course data still stores times as free text, so the parser has to guess that a start before 8:00 means the afternoon. A fixed 24-hour format in the data would remove the guess.
- The root of the database is still readable by everyone, which also exposes the list of admin IDs. Writes remain limited to admins by the rules.
