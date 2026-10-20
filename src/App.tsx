import { useEffect, useState } from 'react';
import './App.css';

type Course = {
  term: string;
  number: string;
  meets: string;
  title: string;
};

type Schedule = {
  title: string;
  courses: Record<string, Course>;
};

type Term = 'Fall' | 'Winter' | 'Spring';

const TermSelector = ({ selectedTerm, onSelect }: {
  selectedTerm: Term;
  onSelect: (term: Term) => void;
}) => (
  <div className="mb-6 flex gap-2" role="group" aria-label="Academic term">
    {(['Fall', 'Winter', 'Spring'] as const).map(term => (
      <button
        key={term}
        type="button"
        aria-pressed={selectedTerm === term}
        onClick={() => onSelect(term)}
        className={`min-h-11 cursor-pointer rounded border px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 ${
          selectedTerm === term
            ? 'border-gray-800 bg-gray-800 text-white'
            : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
        }`}
      >
        {term}
      </button>
    ))}
  </div>
);

const CourseList = ({ courses, selectedTerm, selectedCourses, onSelect }: {
  courses: Record<string, Course>;
  selectedTerm: Term;
  selectedCourses: string[];
  onSelect: (courseId: string) => void;
}) => (
  <ul className="flex flex-wrap gap-3">
    {Object.entries(courses)
      .filter(([, course]) => course.term === selectedTerm)
      .map(([courseTag, courseInfo]) => {
        const isSelected = selectedCourses.includes(courseTag);

        return (
        <li key={courseTag} className="flex w-56 grow">
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(courseTag)}
            className={`flex w-full cursor-pointer flex-col rounded-xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${
              isSelected ? 'border-purple-700 bg-purple-50 text-purple-950' : 'border-gray-300 hover:border-gray-500'
            }`}
          >
            <h2 className="mb-2 flex w-full justify-between gap-2 text-xl">
              <span>{courseInfo.term} CS {courseInfo.number}</span>
              {isSelected && (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" className="mt-1 size-5 shrink-0">
                  <path d="m5 12 4 4 10-10" />
                </svg>
              )}
            </h2>
            <p className="grow">{courseInfo.title}</p>
            <p className="mt-4 border-t border-gray-300 pt-3">{courseInfo.meets}</p>
          </button>
        </li>
        );
      })}
  </ul>
);

const TermPage = ({ schedule }: { schedule: Schedule }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(current => current.includes(courseId)
      ? current.filter(id => id !== courseId)
      : [...current, courseId]);
  };

  return (
    <main className="course-page">
      <h1>{schedule.title}</h1>
      <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
      <CourseList courses={schedule.courses} selectedTerm={selectedTerm}
        selectedCourses={selectedCourses} onSelect={toggleCourse} />
    </main>
  );
};

const App = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch('https://courses.cs.northwestern.edu/394/guides/data/cs-courses-firestore.php', {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error('Could not load courses.');
        return response.json();
      })
      .then(data => setSchedule(data.schedules['CS-2018-2019']))
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load courses.');
      });

    return () => controller.abort();
  }, []);

  if (error) return <main className="course-page"><p>{error}</p></main>;
  if (!schedule) return <main className="course-page"><p>Loading courses...</p></main>;

  return <TermPage schedule={schedule} />;
};

export default App;
