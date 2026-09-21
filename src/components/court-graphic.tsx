export function CourtGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 420"
      className={className}
      role="img"
      aria-label="Indoor padel court"
    >
      <rect width="640" height="420" fill="#07131F" />
      <rect x="48" y="36" width="544" height="348" fill="#0C4A86" />
      <rect x="48" y="36" width="544" height="348" fill="none" stroke="#F7FBFF" strokeWidth="6" />
      <line x1="320" y1="36" x2="320" y2="384" stroke="#F7FBFF" strokeWidth="3" />
      <rect x="48" y="118" width="544" height="184" fill="none" stroke="#F7FBFF" strokeWidth="3" />
      <line x1="48" y1="210" x2="592" y2="210" stroke="#F7FBFF" strokeWidth="2" opacity="0.55" />
      <rect x="40" y="28" width="560" height="364" fill="none" stroke="#9EC9E8" strokeWidth="10" opacity="0.35" />
      <circle cx="412" cy="168" r="10" fill="#D4F34A" />
      <circle cx="428" cy="154" r="6" fill="#D4F34A" opacity="0.7" />
    </svg>
  );
}
