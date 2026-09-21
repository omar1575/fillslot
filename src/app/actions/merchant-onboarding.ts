"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  parseMerchantOnboarding,
  saveMerchantOnboarding,
} from "@/lib/merchant-onboarding";

export type MerchantOnboardingState = { error: string } | null;

export async function completeMerchantOnboardingAction(
  _prev: MerchantOnboardingState,
  formData: FormData,
): Promise<MerchantOnboardingState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/club/onboarding");
  }
  if (session.user.role === "admin") {
    redirect("/admin/venues");
  }

  const parsed = parseMerchantOnboarding(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await saveMerchantOnboarding(session.user.id, parsed.data);
  } catch {
    return { error: "Could not save that leftover week. Try once more." };
  }

  revalidatePath("/club");
  revalidatePath("/deals");
  revalidatePath("/admin/venues");
  redirect("/club");
}
