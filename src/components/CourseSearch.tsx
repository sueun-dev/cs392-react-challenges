type CourseSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

const CourseSearch = ({ value, onChange }: CourseSearchProps) => (
  <div className="course-search">
    <label htmlFor="course-search-input">Search courses</label>
    <div className="course-search-field">
      <input id="course-search-input" type="search" value={value}
        placeholder="Course number or title" autoComplete="off"
        onChange={event => onChange(event.target.value)} />
      {value !== '' && (
        <button type="button" className="course-search-clear"
          aria-label="Clear search" onClick={() => onChange('')}>
          Clear
        </button>
      )}
    </div>
  </div>
);

export default CourseSearch;
