export const ONBOARDING_MIN_AGE = 16;

export const ONBOARDING_INTERESTS = [
  { id: "padel", label: "Padel" },
  { id: "bowling", label: "Bowling" },
  { id: "go-karting", label: "Go-karting" },
  { id: "movies", label: "Movies" },
  { id: "music", label: "Music" },
  { id: "escape-room", label: "Escape room" },
] as const;

export const ONBOARDING_REASONS = [
  {
    id: "cheap-deals",
    label: "Cheap deals",
    hint: "I want leftover hours and tickets at a discount.",
  },
  {
    id: "meet-people",
    label: "Meet new people",
    hint: "I want to show up and maybe find someone to go with.",
  },
] as const;

export type OnboardingInterest = (typeof ONBOARDING_INTERESTS)[number]["id"];
export type OnboardingReason = (typeof ONBOARDING_REASONS)[number]["id"];

export type OnboardingAnswers = {
  dateOfBirth: string;
  interests: OnboardingInterest[];
  reasons: OnboardingReason[];
};

const INTEREST_IDS = new Set(ONBOARDING_INTERESTS.map((item) => item.id));
const REASON_IDS = new Set(ONBOARDING_REASONS.map((item) => item.id));

export function isOnboardingInterest(value: string): value is OnboardingInterest {
  return INTEREST_IDS.has(value as OnboardingInterest);
}

export function isOnboardingReason(value: string): value is OnboardingReason {
  return REASON_IDS.has(value as OnboardingReason);
}

export function isoDateOffsetYears(years: number, from = new Date()) {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export function isConsumerRole(role: unknown) {
  return role == null || role === "consumer";
}

export function safeOnboardingNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (
    value === "/onboarding" ||
    value.startsWith("/onboarding?") ||
    value.startsWith("/login") ||
    value.startsWith("/auth/")
  ) {
    return fallback;
  }
  return value;
}
