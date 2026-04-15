"use client";

import { useEffect } from "react";

export function TimezoneProvider() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (document.cookie.includes(`timezone=${tz}`)) return;
    document.cookie = `timezone=${tz};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  return null;
}
