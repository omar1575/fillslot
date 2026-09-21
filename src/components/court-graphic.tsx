export function CourtGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 420"
      className={className}
      role="img"
      aria-label="Indoor padel court at night"
    >
      <rect width="640" height="420" fill="#07131F" />
      <rect x="0" y="300" width="640" height="120" fill="#05101A" />
      <rect x="56" y="44" width="528" height="332" fill="#0A3A6C" />
      <rect x="72" y="58" width="496" height="304" fill="#0C4A86" />
      <rect x="72" y="58" width="496" height="304" fill="none" stroke="#F4F8FC" strokeWidth="5" />
      <line x1="320" y1="58" x2="320" y2="362" stroke="#F4F8FC" strokeWidth="3" />
      <rect x="72" y="128" width="496" height="164" fill="none" stroke="#F4F8FC" strokeWidth="3" />
      <line x1="72" y1="210" x2="568" y2="210" stroke="#F4F8FC" strokeWidth="2" opacity="0.55" />
      <rect x="64" y="50" width="512" height="320" fill="none" stroke="#9EC9E8" strokeWidth="10" opacity="0.28" />
      <rect x="48" y="36" width="544" height="348" fill="none" stroke="#1473C4" strokeWidth="3" opacity="0.45" />
      <circle cx="418" cy="162" r="11" fill="#D4F34A" />
      <circle cx="436" cy="146" r="6" fill="#D4F34A" opacity="0.7" />
      <circle cx="404" cy="150" r="3" fill="#D4F34A" opacity="0.45" />
    </svg>
  );
}
