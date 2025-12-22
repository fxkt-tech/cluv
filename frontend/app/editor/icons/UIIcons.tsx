/**
 * UI Icons
 * SVG icons for UI elements
 */

interface IconProps {
  size?: number;
  className?: string;
}

export function KivaCutLogo({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/*
        Design: Pure line art (Black & White style)
        - 4 rotating blades
        - Sharp contours
        - No fills
      */}
      <g transform="translate(32, 32)">
        {[0, 90, 180, 270].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Outer Blade Contour - Sharp Scythe Shape */}
            <path
              d="M -2 -28 C -12 -12, -12 4, -2 16 L 0 12 C -8 2, -8 -10, 0 -24 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Inner Detail Line - Adds complexity */}
            <path
              d="M 4 -20 C 0 -10, 0 0, 6 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Dynamic Motion Line - Outer swoosh */}
            <path
              d="M -8 -24 C -16 -8, -16 8, -8 24"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
              fill="none"
            />
          </g>
        ))}

        {/* Central Vortex - Swirling lines */}
        <path
          d="M 6 0 A 6 6 0 0 1 -6 0 A 6 6 0 0 1 6 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.8"
          fill="none"
        />

        {/* Center Point */}
        <circle cx="0" cy="0" r="2" fill="currentColor" />
      </g>
    </svg>
  );
}

export function KeyboardIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="5" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="8" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="11" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="14" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="17" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="5" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="8" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="11" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="14" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="17" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="7" y="15" width="10" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function DeleteIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4 4L12 12M4 12L12 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DragHandleIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  );
}
