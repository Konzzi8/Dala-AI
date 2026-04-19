import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { DashboardThemeProvider } from "@/components/dashboard/dashboard-theme-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <DashboardAppShell>{children}</DashboardAppShell>
    </DashboardThemeProvider>
  );
}
