import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { hasCompletedOnboarding, isConsumerRole } from "@/lib/onboarding";

export const metadata = { title: "Quick intro" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/onboarding");
  }
  if (!isConsumerRole(session.user.role)) {
    redirect("/");
  }
  if (await hasCompletedOnboarding(session.user.id)) {
    redirect("/");
  }
  return <OnboardingScreen />;
}
