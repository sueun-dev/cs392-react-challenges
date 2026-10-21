# Schedule Popup refinement

## Specification prompt (English summary of the chat request)

Refactor the existing course scheduler for readability and give the page and
schedule popup a more consistent design. Keep the course data, term filtering,
multiple selection, selection across terms, empty-state instructions, and all
popup closing behavior. Preserve the purple selection accent and course-card
layout. Use the existing React, TypeScript, and Tailwind setup without new
dependencies or features.

Document the AI-assisted changes and compare the existing implementation with
the refined code.

## Comparison baseline

- Before refinement: commit `e5b1be8` (`Add course plan popup`).

## AI use

For this refinement, I used AI to improve the design and refactor the working
scheduler. The comparison below shows the existing committed code before this
refinement and the updated local code afterward.

## What changed and why

| Area | Before refinement | After refinement | Reason |
| --- | --- | --- | --- |
| Popup ownership | `TermPage` owned the dialog ref and all popup JSX. | `CoursePlan` owns its ref, open/close buttons, and dialog. | Keep popup behavior together and shorten the parent component. |
| Course rendering | `CourseList` filtered courses and rendered every card inline. | `TermPage` derives visible courses, `CourseList` maps them, and `CourseCard` renders one card. | Separate filtering, list rendering, and card presentation. |
| Popup data | Dialog rendering looked up every selected ID in the schedule. | The parent supplies `[courseId, course]` pairs. | The popup needs only its displayed data, rather than the full schedule. |
| Selection | Parent state, functional updates, `filter`, and spread syntax. | Same state and update logic. | Preserve selection behavior and its order across terms. |
| Styling | Long conditional utility strings and unrelated serif defaults. | Tailwind layout utilities plus named CSS classes and shared colors. | Make the visual rules easier to find and keep controls consistent. |
| Appearance | Mixed button treatments and a square popup. | Purple action buttons, grouped term buttons, consistent card spacing, and a rounded popup. | Clarify hierarchy without adding features or controls. |
| Small screens | Basic wrapping and modal scrolling. | Balanced title wrapping, mobile button alignment, and retained modal scrolling. | Keep the existing flow usable on narrow screens. |
| Status messages | Plain loading and error paragraphs. | The same messages with `role="status"` and `role="alert"`. | Expose loading and failure states to assistive technology. |
| Unused CSS | Starter logo animation remained in `App.css`. | Removed the unused animation. | Remove dead styling and its build warning. |

## Relevant code comparison

### Before refinement: popup state inside the page

```tsx
const coursePlan = useRef<HTMLDialogElement>(null);

<button type="button" onClick={() => coursePlan.current?.showModal()}
  className="border px-4 py-2">
  Course plan
</button>
```

### After refinement: popup responsibility in one component

```tsx
const CoursePlan = ({ courses }: { courses: [string, Course][] }) => {
  const dialog = useRef<HTMLDialogElement>(null);
```

The parent prepares the data and renders the component:

```tsx
const visibleCourses = Object.entries(schedule.courses)
  .filter(([, course]) => course.term === selectedTerm);
const plannedCourses: [string, Course][] = selectedCourses
  .map(courseId => [courseId, schedule.courses[courseId]]);

<CoursePlan courses={plannedCourses} />
<CourseList courses={visibleCourses} selectedCourses={selectedCourses} onSelect={toggleCourse} />
```

Both versions use the same native `showModal()` / `close()` behavior and the same
outside-click condition:

```tsx
if (event.target === event.currentTarget) event.currentTarget.close();
```

### Styling selection from existing state

Before refinement, card classes used a conditional expression. After refinement,
the existing `aria-pressed` state also drives the CSS:

```css
.course-card[aria-pressed="true"] {
  border-color: var(--accent);
  background: #f0e8f8;
  color: #351856;
}
```

I prefer the extracted components for organizing this page. Keeping the selection
state in `TermPage` still lets the cards and popup use the same selections. CSS
classes reduce JSX noise, although they add a separate place to read styling.
The original version remains shorter for the popup alone.

## Output and subsequent adjustment

AI produced the component extraction and CSS changes in this working tree. A
copy of that initial local output was retained outside the repository for this
comparison. The browser check then led to two CSS adjustments: balanced heading
wrapping and right alignment of a wrapped Course plan button on narrow screens.
The complete final source diff appears below.

## Verification

- `npm run build`: passed, with the old unused-animation warning removed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Desktop: Fall 27 courses, Winter 31, Spring 33.
- Browser checks: multiple selection, selection across terms, keyboard
  deselection, empty-state instructions, course details, Close button, Escape,
  outside click, and inside-click behavior passed.
- At 390px: page width 390px, no horizontal overflow, popup width 358px.
- At 320px: page width 320px, no horizontal overflow, popup opens and closes.
- With eight selected courses at 390px: popup height 675px, content height 1180px;
  the content scrolls and Close remains reachable.
- Sample contrast checks: muted text on the page 5.70:1, muted text on selected
  cards 5.17:1, purple and white 10.56:1.
- The data-fetching effect and selection updates were preserved. This was a
  scoped browser check, not a claim that every browser or network failure was tested.

## Files for review

1. `src/App.tsx`
2. `src/App.css`
3. `src/index.css`
4. `docs/schedule-popup-refinement.md`

## Publication status

Sueun approved publishing the four reviewed files and deploying the updated app
to Firebase. The release commit and verified deployment result are recorded in
the learning report after publication.

## Complete source diff

<details>
<summary>Expand the exact before and after source changes</summary>

```diff
diff --git a/src/App.css b/src/App.css
index 8b46ffd..26c93dd 100644
--- a/src/App.css
+++ b/src/App.css
@@ -1,23 +1,169 @@
 
-@theme {
-  --animate-logo-spin: logo-spin infinite 20s linear;
-
-  @keyframes logo-spin {
-    from {
-      transform: rotate(0deg);
-    }
-    to {
-      transform: rotate(360deg);
-    }
-  }
-}
-
 .course-page {
   margin: 3rem auto;
   padding: 0 1.25rem;
 }
 
-.course-page h1 {
-  margin: 0 0 1.5rem;
+.page-heading {
+  margin-bottom: 2rem;
+}
+
+.page-heading h1,
+.course-plan h2 {
+  font-family: Georgia, serif;
+  font-weight: 600;
   line-height: 1.2;
 }
+
+.page-heading h1 {
+  font-size: clamp(1.8rem, 3vw, 2.5rem);
+  letter-spacing: -0.025em;
+  text-wrap: balance;
+}
+
+.course-toolbar {
+  margin-bottom: 1.5rem;
+}
+
+.term-selector {
+  padding: 0.25rem;
+  border-radius: 0.75rem;
+  background: #ebe7f0;
+}
+
+.term-button,
+.action-button {
+  min-height: 2.75rem;
+  border-radius: 0.5rem;
+  padding: 0.6rem 1.1rem;
+  font-size: 0.9rem;
+  font-weight: 600;
+}
+
+.term-button {
+  color: var(--muted);
+}
+
+.term-button:hover,
+.term-button[aria-pressed="true"] {
+  background: var(--surface);
+  color: var(--accent);
+}
+
+.action-button {
+  background: var(--accent);
+  color: white;
+}
+
+.action-button:hover {
+  background: #3c2068;
+}
+
+.course-card {
+  padding: 1.25rem;
+  border: 1px solid var(--border);
+  border-radius: 0.875rem;
+  background: var(--surface);
+  line-height: 1.5;
+}
+
+.course-card:hover {
+  border-color: var(--accent);
+}
+
+.course-card[aria-pressed="true"] {
+  border-color: var(--accent);
+  background: #f0e8f8;
+  color: #351856;
+}
+
+.course-card h2 {
+  font-size: 1.05rem;
+  font-weight: 650;
+}
+
+.course-card > p {
+  font-size: 0.9rem;
+}
+
+.course-meeting {
+  width: 100%;
+  border-top: 1px solid var(--border);
+  color: var(--muted);
+  font-variant-numeric: tabular-nums;
+}
+
+.course-plan {
+  width: calc(100% - 2rem);
+  max-width: 34rem;
+  max-height: 80vh;
+  margin: auto;
+  padding: 0;
+  overflow-y: auto;
+  border: 0;
+  border-radius: 1rem;
+  background: var(--surface);
+  color: var(--ink);
+  box-shadow: 0 1.5rem 4rem rgb(30 18 45 / 20%);
+}
+
+.course-plan::backdrop {
+  background: rgb(30 18 45 / 38%);
+}
+
+.plan-content {
+  padding: 1.5rem;
+}
+
+.course-plan h2 {
+  margin-bottom: 1.25rem;
+  font-size: 1.75rem;
+}
+
+.plan-list > li {
+  padding: 1rem 0;
+  border-top: 1px solid var(--border);
+}
+
+.plan-list h3 {
+  margin-bottom: 0.25rem;
+  color: var(--accent);
+  font-weight: 650;
+}
+
+.plan-meeting,
+.plan-empty {
+  color: var(--muted);
+}
+
+.plan-meeting {
+  margin-top: 0.5rem;
+  font-size: 0.9rem;
+  font-variant-numeric: tabular-nums;
+}
+
+.plan-empty {
+  padding: 0.5rem 0 1.5rem;
+}
+
+.plan-footer {
+  margin-top: 0.5rem;
+  padding-top: 1.25rem;
+  border-top: 1px solid var(--border);
+}
+
+@media (max-width: 30rem) {
+  .course-page {
+    margin: 1.75rem auto;
+    padding: 0 1rem;
+  }
+
+  .term-button,
+  .action-button {
+    padding-inline: 0.8rem;
+  }
+
+  .course-toolbar > .action-button {
+    margin-left: auto;
+  }
+}
diff --git a/src/App.tsx b/src/App.tsx
index ad7420a..cf878a4 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -19,18 +19,14 @@ const TermSelector = ({ selectedTerm, onSelect }: {
   selectedTerm: Term;
   onSelect: (term: Term) => void;
 }) => (
-  <div className="flex gap-2" role="group" aria-label="Academic term">
+  <div className="term-selector flex gap-1" role="group" aria-label="Academic term">
     {(['Fall', 'Winter', 'Spring'] as const).map(term => (
       <button
         key={term}
         type="button"
         aria-pressed={selectedTerm === term}
         onClick={() => onSelect(term)}
-        className={`min-h-11 cursor-pointer rounded border px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 ${
-          selectedTerm === term
-            ? 'border-gray-800 bg-gray-800 text-white'
-            : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
-        }`}
+        className="term-button"
       >
         {term}
       </button>
@@ -38,50 +34,94 @@ const TermSelector = ({ selectedTerm, onSelect }: {
   </div>
 );
 
-const CourseList = ({ courses, selectedTerm, selectedCourses, onSelect }: {
-  courses: Record<string, Course>;
-  selectedTerm: Term;
+const CourseCard = ({ courseId, course, isSelected, onSelect }: {
+  courseId: string;
+  course: Course;
+  isSelected: boolean;
+  onSelect: (courseId: string) => void;
+}) => (
+  <button
+    type="button"
+    aria-pressed={isSelected}
+    onClick={() => onSelect(courseId)}
+    className="course-card flex w-full flex-col text-left"
+  >
+    <h2 className="mb-3 flex w-full justify-between gap-2">
+      <span>{course.term} CS {course.number}</span>
+      {isSelected && (
+        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
+          strokeWidth="2" className="size-5 shrink-0">
+          <path d="m5 12 4 4 10-10" />
+        </svg>
+      )}
+    </h2>
+    <p className="grow">{course.title}</p>
+    <p className="course-meeting mt-5 pt-3">{course.meets}</p>
+  </button>
+);
+
+const CourseList = ({ courses, selectedCourses, onSelect }: {
+  courses: [string, Course][];
   selectedCourses: string[];
   onSelect: (courseId: string) => void;
 }) => (
-  <ul className="flex flex-wrap gap-3">
-    {Object.entries(courses)
-      .filter(([, course]) => course.term === selectedTerm)
-      .map(([courseTag, courseInfo]) => {
-        const isSelected = selectedCourses.includes(courseTag);
-
-        return (
-        <li key={courseTag} className="flex w-56 grow">
-          <button
-            type="button"
-            aria-pressed={isSelected}
-            onClick={() => onSelect(courseTag)}
-            className={`flex w-full cursor-pointer flex-col rounded-xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${
-              isSelected ? 'border-purple-700 bg-purple-50 text-purple-950' : 'border-gray-300 hover:border-gray-500'
-            }`}
-          >
-            <h2 className="mb-2 flex w-full justify-between gap-2 text-xl">
-              <span>{courseInfo.term} CS {courseInfo.number}</span>
-              {isSelected && (
-                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
-                  strokeWidth="2" className="mt-1 size-5 shrink-0">
-                  <path d="m5 12 4 4 10-10" />
-                </svg>
-              )}
-            </h2>
-            <p className="grow">{courseInfo.title}</p>
-            <p className="mt-4 border-t border-gray-300 pt-3">{courseInfo.meets}</p>
-          </button>
-        </li>
-        );
-      })}
+  <ul className="flex flex-wrap gap-4">
+    {courses.map(([courseId, course]) => (
+      <li key={courseId} className="flex min-w-0 w-56 grow">
+        <CourseCard courseId={courseId} course={course}
+          isSelected={selectedCourses.includes(courseId)} onSelect={onSelect} />
+      </li>
+    ))}
   </ul>
 );
 
+const CoursePlan = ({ courses }: { courses: [string, Course][] }) => {
+  const dialog = useRef<HTMLDialogElement>(null);
+
+  return (
+    <>
+      <button type="button" className="action-button"
+        onClick={() => dialog.current?.showModal()}>
+        Course plan
+      </button>
+      <dialog ref={dialog} aria-labelledby="course-plan-title" className="course-plan"
+        onClick={event => {
+          if (event.target === event.currentTarget) event.currentTarget.close();
+        }}>
+        <div className="plan-content">
+          <h2 id="course-plan-title">Course plan</h2>
+          {courses.length === 0 ? (
+            <p className="plan-empty">No courses selected. Click a course card to select it.</p>
+          ) : (
+            <ul className="plan-list">
+              {courses.map(([courseId, course]) => (
+                <li key={courseId}>
+                  <h3>{course.term} CS {course.number}</h3>
+                  <p>{course.title}</p>
+                  <p className="plan-meeting">{course.meets}</p>
+                </li>
+              ))}
+            </ul>
+          )}
+          <div className="plan-footer flex justify-end">
+            <button type="button" className="action-button"
+              onClick={() => dialog.current?.close()}>
+              Close
+            </button>
+          </div>
+        </div>
+      </dialog>
+    </>
+  );
+};
+
 const TermPage = ({ schedule }: { schedule: Schedule }) => {
   const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
   const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
-  const coursePlan = useRef<HTMLDialogElement>(null);
+  const visibleCourses = Object.entries(schedule.courses)
+    .filter(([, course]) => course.term === selectedTerm);
+  const plannedCourses: [string, Course][] = selectedCourses
+    .map(courseId => [courseId, schedule.courses[courseId]]);
 
   const toggleCourse = (courseId: string) => {
     setSelectedCourses(current => current.includes(courseId)
@@ -91,45 +131,14 @@ const TermPage = ({ schedule }: { schedule: Schedule }) => {
 
   return (
     <main className="course-page">
-      <h1>{schedule.title}</h1>
-      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
+      <header className="page-heading">
+        <h1>{schedule.title}</h1>
+      </header>
+      <div className="course-toolbar flex flex-wrap items-center justify-between gap-3">
         <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
-        <button type="button" onClick={() => coursePlan.current?.showModal()}
-          className="border px-4 py-2">
-          Course plan
-        </button>
+        <CoursePlan courses={plannedCourses} />
       </div>
-      <CourseList courses={schedule.courses} selectedTerm={selectedTerm}
-        selectedCourses={selectedCourses} onSelect={toggleCourse} />
-      <dialog ref={coursePlan} aria-labelledby="course-plan-title"
-        className="m-auto max-h-[80vh] w-11/12 max-w-lg overflow-y-auto border p-0"
-        onClick={event => {
-          if (event.target === event.currentTarget) event.currentTarget.close();
-        }}>
-        <div className="p-6">
-          <h2 id="course-plan-title" className="text-xl font-semibold">Course plan</h2>
-          {selectedCourses.length === 0 ? (
-            <p className="my-4">No courses selected. Click a course card to select it.</p>
-          ) : (
-            <ul className="my-4 space-y-4">
-              {selectedCourses.map(courseId => {
-                const course = schedule.courses[courseId];
-                return (
-                  <li key={courseId}>
-                    <h3 className="font-semibold">{course.term} CS {course.number}</h3>
-                    <p>{course.title}</p>
-                    <p>{course.meets}</p>
-                  </li>
-                );
-              })}
-            </ul>
-          )}
-          <button type="button" onClick={() => coursePlan.current?.close()}
-            className="border px-4 py-2">
-            Close
-          </button>
-        </div>
-      </dialog>
+      <CourseList courses={visibleCourses} selectedCourses={selectedCourses} onSelect={toggleCourse} />
     </main>
   );
 };
@@ -156,8 +165,8 @@ const App = () => {
     return () => controller.abort();
   }, []);
 
-  if (error) return <main className="course-page"><p>{error}</p></main>;
-  if (!schedule) return <main className="course-page"><p>Loading courses...</p></main>;
+  if (error) return <main className="course-page"><p role="alert">{error}</p></main>;
+  if (!schedule) return <main className="course-page"><p role="status">Loading courses...</p></main>;
 
   return <TermPage schedule={schedule} />;
 };
diff --git a/src/index.css b/src/index.css
index ee44392..f563486 100644
--- a/src/index.css
+++ b/src/index.css
@@ -1,15 +1,33 @@
 @import "tailwindcss";
 
+:root {
+  --accent: #4e2a84;
+  --ink: #292131;
+  --muted: #685d73;
+  --border: #dfd8e7;
+  --surface: #fff;
+  color: var(--ink);
+  background: #f7f5f9;
+  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+  line-height: 1.6;
+}
+
 body {
-  margin: 8px;
-  color: #000;
-  font-family: serif;
+  margin: 0;
+}
+
+button {
+  cursor: pointer;
+}
+
+button:focus-visible {
+  outline: 2px solid var(--accent);
+  outline-offset: 3px;
 }
 
-h1 {
-  margin-block: 0.67em;
-  font-size: 2em;
-  font-weight: bold;
+::selection {
+  background: #ddccef;
+  color: #351856;
 }
 
 ul {
```

</details>
