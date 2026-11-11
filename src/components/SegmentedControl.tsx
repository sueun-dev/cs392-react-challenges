type SegmentedControlProps<Value extends string> = {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
};

const SegmentedControl = <Value extends string>({
  label, options, value, onChange, className = '',
}: SegmentedControlProps<Value>) => (
  <div className={`segmented flex gap-1 ${className}`.trim()} role="group" aria-label={label}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className="segmented-button"
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
