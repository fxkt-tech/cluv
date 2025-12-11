/**
 * UI Icons
 * SVG icons for UI elements
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export function KeyboardIcon({ size = 24, className = '' }: IconProps) {
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
