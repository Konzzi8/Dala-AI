"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatProvider, useChatContext } from "./chat-context";
import { DashboardHeader } from "./dashboard-header";
import { DashboardMobileNav } from "./dashboard-mobile-nav";
import { DashboardSidebar } from "./dashboard-sidebar";
import { FloatingChat } from "./floating-chat";
import { internalApiUrl } from "@/lib/api-urls";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const COLLAPSE_KEY = "dala-sidebar-collapsed";

function DashboardAppShellInner({ children }: { children: React.ReactNode }) {
  const { layoutReserve } = useChatContext();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [firstName, setFirstName] = useState("there");
  const [email, setEmail] = useState("");
  const [badgeEmails, setBadgeEmails] = useState(0);
  const [badgeRisks, setBadgeRisks] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(internalApiUrl("/api/me"), { credentials: "include" });
        const data = (await res.json()) as { firstName?: string; email?: string };
        if (!cancelled && res.ok) {
          if (data.firstName) setFirstName(data.firstName);
          if (data.email) setEmail(data.email);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshBadges = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch(internalApiUrl("/api/notifications"), { credentials: "include" });
        const data = (await res.json()) as { unreadEmails?: number; highRiskShipments?: number };
        if (res.ok) {
          setBadgeEmails(typeof data.unreadEmails === "number" ? data.unreadEmails : 0);
          setBadgeRisks(typeof data.highRiskShipments === "number" ? data.highRiskShipments : 0);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    refreshBadges();
    const t = setInterval(refreshBadges, 60_000);
    return () => clearInterval(t);
  }, [refreshBadges]);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const channel = sb
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments" },
        () => refreshBadges(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        () => refreshBadges(),
      );
    channel.subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [refreshBadges]);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function onSignOut() {
    const sb = getSupabaseBrowser();
    try {
      await sb?.auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const padLeft = collapsed ? "md:pl-[72px]" : "md:pl-[260px]";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] dark:bg-transparent dark:text-inherit">
      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        badgeEmails={badgeEmails}
        badgeRisks={badgeRisks}
        firstName={firstName}
        onSignOut={onSignOut}
      />

      <div
        className={`min-h-screen transition-[padding] duration-200 ease-out ${padLeft}`}
        style={{
          paddingRight: layoutReserve.reserveRightPx > 0 ? layoutReserve.reserveRightPx : undefined,
          paddingBottom: layoutReserve.reserveBottomPx > 0 ? layoutReserve.reserveBottomPx : undefined,
        }}
      >
        <DashboardHeader firstName={firstName} email={email} />
        <main className="mx-auto max-w-[1280px] px-8 py-8 pb-28 md:pb-12">
          {children}
        </main>
      </div>

      <DashboardMobileNav />
      <FloatingChat />
    </div>
  );
}

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <DashboardAppShellInner>{children}</DashboardAppShellInner>
    </ChatProvider>
  );
}
