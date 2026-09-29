import './App.css';

const schedules = {
  'CS-2018-2019': {
    title: 'CS Courses for 2018-2019',
    courses: {
      F101: {
        term: 'Fall',
        number: '101',
        meets: 'MWF 11:00-11:50',
        title: 'Computer Science: Concepts, Philosophy, and Connections',
      },
      F110: {
        term: 'Fall',
        number: '110',
        meets: 'MWF 10:00-10:50',
        title: 'Intro Programming for non-majors',
      },
      S313: {
        term: 'Spring',
        number: '313',
        meets: 'TuTh 15:30-16:50',
        title: 'Tangible Interaction Design and Learning',
      },
      S314: {
        term: 'Spring',
        number: '314',
        meets: 'TuTh 9:30-10:50',
        title: 'Tech & Human Interaction',
      },
    },
  },
};

const schedule = schedules['CS-2018-2019'];

const App = () => (
  <main>
    <h1>{schedule.title}</h1>
    <ul>
      {Object.entries(schedule.courses).map(([code, course]) => (
        <li key={code}>
          {course.term} CS {course.number}: {course.title}
        </li>
      ))}
    </ul>
  </main>
);

export default App;
