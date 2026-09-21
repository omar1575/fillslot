import type { ReactNode } from "react";
import { CourtGraphic } from "@/components/court-graphic";
import type { ActivityCategory } from "@/db/schema";

function Frame({
  className,
  label,
  children,
}: {
  className?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 640 420" className={className} role="img" aria-label={label}>
      <rect width="640" height="420" fill="#07131F" />
      {children}
    </svg>
  );
}

export function ActivityGraphic({
  category,
  className,
}: {
  category: ActivityCategory;
  className?: string;
}) {
  if (category === "padel") return <CourtGraphic className={className} />;

  if (category === "hair") {
    return (
      <Frame className={className} label="Hair chair">
        <rect x="180" y="90" width="280" height="240" fill="#0C4A86" />
        <rect x="230" y="140" width="180" height="120" fill="none" stroke="#D4F34A" strokeWidth="6" />
        <circle cx="320" cy="130" r="28" fill="#D4F34A" />
        <rect x="290" y="260" width="60" height="70" fill="#F7FBFF" />
      </Frame>
    );
  }

  if (category === "spa") {
    return (
      <Frame className={className} label="Spa room">
        <rect x="90" y="80" width="460" height="260" fill="#0C4A86" />
        <ellipse cx="320" cy="210" rx="140" ry="70" fill="#1473C4" />
        <circle cx="250" cy="150" r="12" fill="#D4F34A" />
        <circle cx="390" cy="150" r="8" fill="#D4F34A" opacity="0.7" />
      </Frame>
    );
  }

  if (category === "bowling") {
    return (
      <Frame className={className} label="Bowling lane">
        <rect x="220" y="40" width="200" height="340" fill="#0C4A86" />
        <line x1="250" y1="40" x2="250" y2="380" stroke="#F7FBFF" strokeWidth="3" />
        <line x1="390" y1="40" x2="390" y2="380" stroke="#F7FBFF" strokeWidth="3" />
        <circle cx="320" cy="300" r="22" fill="#D4F34A" />
        <rect x="292" y="70" width="16" height="50" fill="#F7FBFF" />
        <rect x="312" y="62" width="16" height="58" fill="#F7FBFF" />
        <rect x="332" y="70" width="16" height="50" fill="#F7FBFF" />
      </Frame>
    );
  }

  if (category === "go_karting") {
    return (
      <Frame className={className} label="Go-kart track">
        <ellipse cx="320" cy="210" rx="210" ry="130" fill="#0C4A86" />
        <ellipse cx="320" cy="210" rx="130" ry="70" fill="#07131F" />
        <rect x="250" y="175" width="70" height="36" rx="8" fill="#D4F34A" />
        <circle cx="262" cy="214" r="10" fill="#F7FBFF" />
        <circle cx="308" cy="214" r="10" fill="#F7FBFF" />
      </Frame>
    );
  }

  if (category === "escape_room") {
    return (
      <Frame className={className} label="Escape room">
        <rect x="120" y="70" width="400" height="280" fill="#0C4A86" />
        <rect x="170" y="120" width="110" height="160" fill="#1473C4" />
        <rect x="360" y="120" width="110" height="160" fill="#1473C4" />
        <circle cx="225" cy="185" r="14" fill="#D4F34A" />
        <rect x="300" y="250" width="40" height="70" fill="#D4F34A" />
      </Frame>
    );
  }

  if (category === "cinema") {
    return (
      <Frame className={className} label="Cinema screen">
        <rect x="80" y="70" width="480" height="200" fill="#0C4A86" />
        <rect x="110" y="90" width="420" height="150" fill="#1473C4" />
        <rect x="140" y="300" width="50" height="30" fill="#D4F34A" />
        <rect x="210" y="300" width="50" height="30" fill="#F7FBFF" opacity="0.4" />
        <rect x="280" y="300" width="50" height="30" fill="#F7FBFF" opacity="0.4" />
        <rect x="350" y="300" width="50" height="30" fill="#D4F34A" />
        <rect x="420" y="300" width="50" height="30" fill="#F7FBFF" opacity="0.4" />
      </Frame>
    );
  }

  return (
    <Frame className={className} label="Stadium seating">
      <polygon points="80,320 320,80 560,320" fill="#0C4A86" />
      <rect x="250" y="250" width="140" height="70" fill="#1473C4" />
      <circle cx="320" cy="200" r="16" fill="#D4F34A" />
      <rect x="120" y="300" width="40" height="20" fill="#D4F34A" />
      <rect x="170" y="280" width="40" height="20" fill="#F7FBFF" opacity="0.45" />
      <rect x="430" y="280" width="40" height="20" fill="#F7FBFF" opacity="0.45" />
      <rect x="480" y="300" width="40" height="20" fill="#D4F34A" />
    </Frame>
  );
}

export function CategoryCollage({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <ActivityGraphic category="padel" className="w-full" />
      <ActivityGraphic category="cinema" className="w-full" />
      <ActivityGraphic category="bowling" className="w-full" />
      <ActivityGraphic category="spa" className="w-full" />
    </div>
  );
}
