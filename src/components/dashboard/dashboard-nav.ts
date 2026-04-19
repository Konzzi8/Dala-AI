import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Package,
  Settings,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "emails" | "risks";
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const DASHBOARD_NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/shipments", label: "Shipments", icon: Package },
      { href: "/dashboard/emails", label: "Emails", icon: Mail, badgeKey: "emails" },
      { href: "/dashboard/risks", label: "Risk Alerts", icon: AlertTriangle, badgeKey: "risks" },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/dala-ai-assistant", label: "Dala AI Assistant", icon: MessageSquareText },
    ],
  },
  {
    label: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

/** Flat list for mobile nav */
export const DASHBOARD_NAV: NavItem[] = DASHBOARD_NAV_SECTIONS.flatMap((s) => s.items);

export const MOBILE_NAV: NavItem[] = [
  DASHBOARD_NAV[0]!,
  DASHBOARD_NAV[1]!,
  DASHBOARD_NAV[2]!,
  DASHBOARD_NAV[3]!,
  DASHBOARD_NAV[DASHBOARD_NAV.length - 1]!,
];
