import type { ReactNode } from "react";
import { auth } from "@/auth";
import { OnboardingPathSync } from "@/components/onboarding/onboarding-path-sync";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { hasCompletedOnboarding, isConsumerRole } from "@/lib/onboarding";

export async function OnboardingGate({ children }: { children: ReactNode }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return children;
    if (!isConsumerRole(session.user.role)) return children;
    if (await hasCompletedOnboarding(session.user.id)) return children;
    return (
      <>
        <OnboardingPathSync />
        <OnboardingScreen />
      </>
    );
  } catch {
    return children;
  }
}
