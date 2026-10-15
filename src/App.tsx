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

const CourseList = ({ courses, selectedTerm }: {
  courses: Record<string, Course>;
  selectedTerm: Term;
}) => (
  <ul className="flex flex-wrap gap-3">
    {Object.entries(courses)
      .filter(([, course]) => course.term === selectedTerm)
      .map(([courseTag, courseInfo]) => (
        <li key={courseTag} className="flex w-56 grow flex-col border border-gray-300 p-4">
          <h2 className="mb-2 text-xl">{courseInfo.term} CS {courseInfo.number}</h2>
          <p className="grow">{courseInfo.title}</p>
          <p className="mt-4 border-t border-gray-300 pt-3">{courseInfo.meets}</p>
        </li>
      ))}
  </ul>
);

const TermPage = ({ schedule }: { schedule: Schedule }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');

  return (
    <main className="course-page">
      <h1>{schedule.title}</h1>
      <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
      <CourseList courses={schedule.courses} selectedTerm={selectedTerm} />
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
