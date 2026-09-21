"use client";

import { useEffect } from "react";

export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      window.location.reload();
    }, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);
  return null;
}
