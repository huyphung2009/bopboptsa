import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle coordinate axis */}
      <path
        d="M5 24.5H27"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 4.5V27.5"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Symmetrical Parabol curve */}
      <path
        d="M6.5 24.5C9.5 11.5 12.6 7 16 7C19.4 7 22.5 11.5 25.5 24.5"
        stroke="#B91C1C"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Convergence vertex dot */}
      <circle cx="16" cy="7" r="2.3" fill="#B91C1C" />
    </svg>
  );
};
