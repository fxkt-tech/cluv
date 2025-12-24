/**
 * PropertySlider Component
 * Reusable slider input for properties
 */

interface PropertySliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PropertySlider({
  label,
  value,
  min = 0,
  max = 200,
  unit = "%",
  step = 0.1,
  onChange,
  disabled = false,
}: PropertySliderProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === "-") {
      return;
    }
    const numValue = step >= 1 ? parseInt(val, 10) : parseFloat(val);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(step >= 1 ? Math.round(newValue) : newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(step >= 1 ? Math.round(newValue) : newValue);
  };

  return (
    <div
      className={`flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="text-xs text-text-secondary min-w-15">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-editor-hover accent-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex items-center gap-0.5 w-18 bg-editor-panel rounded px-1.5 py-0.5">
        <input
          type="number"
          value={step >= 1 ? Math.round(value) : value.toFixed(1)}
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full text-xs text-text-secondary text-right bg-transparent border-none outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <span className="text-xs text-text-muted px-0.5">{unit}</span>
        <div className="flex flex-col ml-0.5">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className="h-2.5 w-3 flex items-center justify-center text-text-muted hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 leading-none"
          >
            <svg
              width="8"
              height="4"
              viewBox="0 0 8 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className="h-2.5 w-3 flex items-center justify-center text-text-muted hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 leading-none"
          >
            <svg
              width="8"
              height="4"
              viewBox="0 0 8 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 4L0 0H8L4 4Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
