"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OnboardingPathSync() {
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [pathname, router]);

  return null;
}
