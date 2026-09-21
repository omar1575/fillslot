import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { OnboardingPathSync } from "@/components/onboarding/onboarding-path-sync";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { hasCompletedOnboarding, isConsumerRole } from "@/lib/onboarding";

function skipGuestOnboarding(pathname: string) {
  return (
    pathname.startsWith("/club") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  );
}

export async function OnboardingGate({ children }: { children: ReactNode }) {
  try {
    const pathname = (await headers()).get("x-fillslot-pathname") ?? "";
    if (skipGuestOnboarding(pathname)) return children;
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
