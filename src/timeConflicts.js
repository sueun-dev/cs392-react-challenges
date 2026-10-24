const toClockMinutes = time => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const readMeeting = meeting => {
  const [dayText, clockText] = meeting.split(' ');
  const [start, end] = clockText.split('-').map(toClockMinutes);
  return { days: dayText.match(/[A-Z][a-z]*/g) ?? [], start, end };
};

const daysOverlap = (daysA, daysB) => daysA.some(day => daysB.includes(day));

const timesOverlap = (slotA, slotB) => slotA.start < slotB.end && slotB.start < slotA.end;

export const hasTimeClash = (courseA, courseB) => {
  if (courseA.term !== courseB.term) return false;
  if (!courseA.meets || !courseB.meets) return false;

  const slotA = readMeeting(courseA.meets);
  const slotB = readMeeting(courseB.meets);
  return daysOverlap(slotA.days, slotB.days) && timesOverlap(slotA, slotB);
};
