"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Bot, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useChatContext } from "./chat-context";
import { DASHBOARD_NAV_SECTIONS } from "./dashboard-nav";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  badgeEmails: number;
  badgeRisks: number;
  firstName: string;
  onSignOut: () => void;
};

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  badgeEmails,
  badgeRisks,
  firstName,
  onSignOut,
}: Props) {
  const pathname = usePathname();
  const { open: assistantOpen, setOpen: setAssistantOpen } = useChatContext();

  function badgeFor(key?: "emails" | "risks") {
    if (key === "emails") return badgeEmails > 0 ? Math.min(99, badgeEmails) : 0;
    if (key === "risks") return badgeRisks > 0 ? Math.min(99, badgeRisks) : 0;
    return 0;
  }

  const initials = firstName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-[#1e293b] bg-[#0f172a] text-[#94a3b8] transition-[width] duration-200 ease-out md:flex ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#1e293b] px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
            <Anchor className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                Dala AI
              </p>
              <p className="truncate text-[13px] leading-normal text-[#64748b]">Freight intelligence</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64748b] transition duration-150 ease-out hover:bg-[#1e293b] hover:text-[#cbd5e1]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="shrink-0 border-b border-[#1e293b] px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => setAssistantOpen(!assistantOpen)}
          title={collapsed ? "AI Assistant" : undefined}
          className={`relative flex h-10 w-full items-center gap-3 rounded-lg border-l-[3px] pl-3 text-[14px] font-medium transition duration-150 ease-out ${
            assistantOpen
              ? "border-l-[#38bdf8] bg-[#1e293b] text-white shadow-sm ring-1 ring-sky-500/20"
              : "border-l-transparent text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
          }`}
        >
          <Bot className="h-[18px] w-[18px] shrink-0" strokeWidth={assistantOpen ? 2 : 1.75} />
          {!collapsed && (
            <span className="flex-1 truncate text-left">AI Assistant</span>
          )}
        </button>
      </div>

      <nav className="scroll-sleek flex-1 space-y-0 overflow-y-auto px-3 py-4">
        {DASHBOARD_NAV_SECTIONS.map((section) => (
          <div key={section.label} className={collapsed ? "mt-0 first:mt-0" : "mt-6 first:mt-0"}>
            {!collapsed && (
              <p
                className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#475569]"
                style={{ marginTop: section.label === "Workspace" ? 0 : undefined }}
              >
                {section.label}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const b = item.badgeKey ? badgeFor(item.badgeKey) : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex h-10 items-center gap-3 rounded-lg border-l-[3px] pl-3 text-[14px] font-medium transition duration-150 ease-out ${
                        active
                          ? "border-l-[#2563eb] bg-[#1e293b] text-white"
                          : "border-l-transparent text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#cbd5e1]"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2 : 1.75} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {b > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[11px] font-semibold text-white">
                              {b > 99 ? "99+" : b}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && b > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#dc2626]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#1e293b] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e293b] text-[12px] font-semibold text-white ring-2 ring-[#334155]"
            aria-hidden
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-white">{firstName}</p>
              <p className="truncate text-[12px] text-[#64748b]">Operator</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#334155] bg-transparent px-3 text-[14px] font-medium text-[#cbd5e1] transition duration-150 ease-out hover:bg-[#1e293b] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
