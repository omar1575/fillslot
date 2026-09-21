import type { ReactNode } from "react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function Template({ children }: { children: ReactNode }) {
  return <OnboardingGate>{children}</OnboardingGate>;
}
