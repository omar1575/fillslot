import { differenceInYears, isValid, parseISO } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { userOnboarding } from "@/db/onboarding-schema";
import {
  isOnboardingInterest,
  isOnboardingReason,
  ONBOARDING_MIN_AGE,
  type OnboardingAnswers,
} from "@/lib/onboarding-options";

export {
  isConsumerRole,
  isoDateOffsetYears,
  ONBOARDING_INTERESTS,
  ONBOARDING_MIN_AGE,
  ONBOARDING_REASONS,
  safeOnboardingNextPath,
  type OnboardingAnswers,
  type OnboardingInterest,
  type OnboardingReason,
} from "@/lib/onboarding-options";

let ensuredTable: Promise<void> | null = null;

export function parseOnboardingAnswers(formData: FormData):
  | { ok: true; data: OnboardingAnswers }
  | { ok: false; error: string } {
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const interests = formData.getAll("interests").map(String).filter(isOnboardingInterest);
  const reasons = formData.getAll("reasons").map(String).filter(isOnboardingReason);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return { ok: false, error: "Enter your date of birth." };
  }

  const parsed = parseISO(dateOfBirth);
  if (!isValid(parsed)) {
    return { ok: false, error: "That date of birth does not look right." };
  }

  const age = differenceInYears(new Date(), parsed);
  if (age < ONBOARDING_MIN_AGE) {
    return {
      ok: false,
      error: `You need to be at least ${ONBOARDING_MIN_AGE} to use Fillslot.`,
    };
  }
  if (age > 120) {
    return { ok: false, error: "Enter a real date of birth." };
  }

  if (interests.length === 0) {
    return { ok: false, error: "Pick at least one thing you are into." };
  }
  if (reasons.length === 0) {
    return { ok: false, error: "Tell us why you are here." };
  }

  return { ok: true, data: { dateOfBirth, interests, reasons } };
}

async function ensureOnboardingTable() {
  if (!ensuredTable) {
    ensuredTable = (async () => {
      const db = await getDb();
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_onboarding (
          user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
          date_of_birth date NOT NULL,
          interests text[] NOT NULL,
          reasons text[] NOT NULL,
          completed_at timestamp NOT NULL DEFAULT now()
        )
      `);
    })();
    ensuredTable.catch(() => {
      ensuredTable = null;
    });
  }
  return ensuredTable;
}

export async function hasCompletedOnboarding(userId: string) {
  try {
    await ensureOnboardingTable();
    const db = await getDb();
    const row = await db
      .select({ userId: userOnboarding.userId })
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId))
      .limit(1);
    return Boolean(row[0]);
  } catch {
    return true;
  }
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  await ensureOnboardingTable();
  const db = await getDb();
  await db
    .insert(userOnboarding)
    .values({
      userId,
      dateOfBirth: answers.dateOfBirth,
      interests: answers.interests,
      reasons: answers.reasons,
    })
    .onConflictDoUpdate({
      target: userOnboarding.userId,
      set: {
        dateOfBirth: answers.dateOfBirth,
        interests: answers.interests,
        reasons: answers.reasons,
        completedAt: new Date(),
      },
    });
}
