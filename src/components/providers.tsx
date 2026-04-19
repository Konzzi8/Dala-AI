"use client";

import type { ReactNode } from "react";

/** App shell; theme after login lives in `DashboardThemeProvider` (dashboard layout only). */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
