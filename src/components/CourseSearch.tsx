type CourseSearchProps = {
  value: string;
  resultCount: number;
  totalCount: number;
  onChange: (value: string) => void;
};

const CourseSearch = ({ value, resultCount, totalCount, onChange }: CourseSearchProps) => (
  <div className="course-search">
    <label htmlFor="course-search-input">Search courses</label>
    <div className="course-search-field">
      <input id="course-search-input" type="search" value={value}
        placeholder="Number, title or day, e.g. 214, data, tuesday" autoComplete="off"
        onChange={event => onChange(event.target.value)} />
      {value !== '' && (
        <button type="button" className="course-search-clear"
          aria-label="Clear search" onClick={() => onChange('')}>
          Clear
        </button>
      )}
    </div>
    <p className="course-search-count" aria-live="polite">
      {value.trim() !== '' && `${resultCount} of ${totalCount} courses match`}
    </p>
  </div>
);

export default CourseSearch;
