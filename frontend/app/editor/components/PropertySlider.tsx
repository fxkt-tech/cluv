/**
 * PropertySlider Component
 * Reusable slider input for properties
 */

import { COLORS } from "../constants/theme";

interface PropertySliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function PropertySlider({
  label,
  value,
  min = 0,
  max = 200,
  unit = "%",
  onChange,
}: PropertySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs" style={{ color: COLORS.text.secondary }}>
        <span>{label}</span>
        <span>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-lg appearance-none cursor-pointer"
        style={{
          backgroundColor: COLORS.editor.hover,
          accentColor: COLORS.accent.blue,
        }}
      />
    </div>
  );
}
