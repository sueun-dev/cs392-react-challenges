import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WeekCalendar from './WeekCalendar';

const intro = { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro to Computing' };
const systems = { term: 'Fall', number: '213', meets: 'TuTh 3:30-4:50', title: 'Intro to systems' };
const winter = { term: 'Winter', number: '110', meets: 'Tu 10:00-11:00', title: 'Programming' };

describe('WeekCalendar', () => {
  it('puts each course on its meeting days with its time', () => {
    render(<WeekCalendar courses={[['f101', intro]]} />);
    for (const day of ['Monday', 'Wednesday', 'Friday']) {
      const list = screen.getByRole('list', { name: day });
      expect(within(list).getByText('101')).toBeInTheDocument();
      expect(within(list).getByText('11:00-11:50')).toBeInTheDocument();
    }
    for (const day of ['Tuesday', 'Thursday']) {
      expect(within(screen.getByRole('list', { name: day })).queryByText('101')).not.toBeInTheDocument();
    }
  });

  it('shows afternoon classes written on a 12-hour clock at their 24-hour time', () => {
    render(<WeekCalendar courses={[['f213', systems]]} />);
    expect(within(screen.getByRole('list', { name: 'Tuesday' })).getByText('15:30-16:50')).toBeInTheDocument();
  });

  it('gives each term its own calendar', () => {
    render(<WeekCalendar courses={[['f101', intro], ['w110', winter]]} />);
    expect(screen.getByRole('region', { name: 'Fall' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Winter' })).toBeInTheDocument();
  });

  it('names courses that have no meeting time to show', () => {
    render(<WeekCalendar courses={[['x', { ...intro, number: '999', meets: 'TBA' }]]} />);
    expect(screen.getByText(/No meeting time to show for CS 999/)).toBeInTheDocument();
  });

  it('renders nothing without courses', () => {
    const { container } = render(<WeekCalendar courses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
