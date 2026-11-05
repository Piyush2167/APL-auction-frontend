"use client";
import { LayoutDashboard, Gavel, Shield, RefreshCcw, ListOrdered, History } from "lucide-react";
import { RequireRole, AppShell } from "@/components/shared";
import { LiveProvider } from "@/contexts/LiveContext";

const NAV = [
  { href: "/captain/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/captain/auction", label: "Live auction", icon: Gavel },
  { href: "/captain/team", label: "My squad", icon: Shield },
  { href: "/captain/resale", label: "Resale requests", icon: RefreshCcw },
  { href: "/captain/leaderboard", label: "Leaderboard", icon: ListOrdered },
  { href: "/captain/history", label: "Bid history", icon: History },
];

export default function CaptainLayout({ children }) {
  return (
    <RequireRole role="CAPTAIN">
      <LiveProvider>
        <AppShell nav={NAV} title="Team captain">{children}</AppShell>
      </LiveProvider>
    </RequireRole>
  );
}
