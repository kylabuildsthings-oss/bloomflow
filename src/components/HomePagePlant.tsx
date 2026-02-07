/**
 * Plant illustration for the homepage (logged-in state).
 * SVG potted plant in BloomFlow brand colors.
 */
export function HomePagePlant() {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-48 w-48 sm:h-56 sm:w-56"
      aria-hidden
    >
      {/* Pot */}
      <path
        d="M60 160 L70 240 L130 240 L140 160 Z"
        fill="#CC7357"
        className="text-accent"
      />
      <path
        d="M70 240 L130 240 L140 160 L60 160"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
        fill="none"
      />
      {/* Pot rim */}
      <ellipse cx="100" cy="160" rx="45" ry="8" fill="#B8654A" />
      {/* Soil */}
      <ellipse cx="100" cy="155" rx="38" ry="6" fill="#5C4033" />
      {/* Stem */}
      <path
        d="M100 155 Q105 100 100 50"
        stroke="#87A96B"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaves */}
      <ellipse cx="85" cy="95" rx="18" ry="12" fill="#87A96B" transform="rotate(-25 85 95)" />
      <ellipse cx="115" cy="90" rx="18" ry="12" fill="#9AB87A" transform="rotate(20 115 90)" />
      <ellipse cx="92" cy="60" rx="16" ry="10" fill="#87A96B" transform="rotate(-10 92 60)" />
      <ellipse cx="108" cy="55" rx="16" ry="10" fill="#9AB87A" transform="rotate(15 108 55)" />
      {/* Small flower/ bud at top */}
      <circle cx="100" cy="38" r="10" fill="#87A96B" />
      <circle cx="100" cy="38" r="6" fill="#F8F4E9" />
    </svg>
  );
}
