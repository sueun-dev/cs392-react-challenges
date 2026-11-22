import { noteMaxLength } from '../courseNotes';
import type { Course } from '../schedule';

type PlanNoteProps = {
  course: Course;
  value: string;
  onChange: (text: string) => void;
};

const PlanNote = ({ course, value, onChange }: PlanNoteProps) => (
  <textarea className="plan-note" rows={2} maxLength={noteMaxLength}
    aria-label={`Note for ${course.term} CS ${course.number}`}
    placeholder="Add a note, e.g. professor, room, why you picked it"
    value={value}
    onChange={event => onChange(event.target.value)} />
);

export default PlanNote;
