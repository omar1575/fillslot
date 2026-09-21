"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  isConsumerRole,
  parseOnboardingAnswers,
  safeOnboardingNextPath,
  saveOnboarding,
} from "@/lib/onboarding";

export type OnboardingFormState = { error: string } | null;

export async function completeOnboardingAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/onboarding");
  }
  if (!isConsumerRole(session.user.role)) {
    redirect("/");
  }

  const parsed = parseOnboardingAnswers(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await saveOnboarding(session.user.id, parsed.data);
  } catch {
    return { error: "Could not save those answers. Try once more." };
  }

  redirect(safeOnboardingNextPath(formData.get("next")));
}
