import type { CSSProperties } from 'react';
import { buildCalendars, formatTime, weekdays, type CalendarCourse } from './calendar';

const WeekCalendar = ({ courses }: { courses: [string, CalendarCourse][] }) => (
  <>
    {buildCalendars(courses).map(({ term, blocks, unscheduled, startHour, endHour }) => {
      const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
      const span = (endHour - startHour) * 60;
      const percent = (minutes: number) => `${((minutes - startHour * 60) / span) * 100}%`;

      return (
        <section key={term} className="week-calendar" aria-labelledby={`calendar-${term}`}>
          <h3 id={`calendar-${term}`}>{term}</h3>
          <div className="week-grid" style={{ '--hours': hours.length } as CSSProperties}>
            <div aria-hidden="true" />
            {weekdays.map(day => (
              <div key={day.key} className="week-day-name" aria-hidden="true">{day.short}</div>
            ))}
            <div className="week-hours" aria-hidden="true">
              {hours.map(hour => (
                <span key={hour} style={{ top: percent(hour * 60) }}>{hour}:00</span>
              ))}
            </div>
            {weekdays.map(day => (
              <ol key={day.key} className="week-day" aria-label={day.name}>
                {blocks.filter(block => block.day === day.key).map(block => (
                  <li key={block.courseId} className="week-block" title={block.title}
                    style={{ top: percent(block.start), height: `${((block.end - block.start) / span) * 100}%` }}>
                    <strong><span className="week-prefix">CS </span>{block.number}</strong>
                    <span>{formatTime(block.start)}-{formatTime(block.end)}</span>
                  </li>
                ))}
              </ol>
            ))}
          </div>
          {unscheduled.length > 0 && (
            <p className="week-note">
              No meeting time to show for {unscheduled.map(({ label }) => label).join(', ')}.
            </p>
          )}
        </section>
      );
    })}
  </>
);

export default WeekCalendar;
