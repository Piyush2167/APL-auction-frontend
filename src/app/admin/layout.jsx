"use client";
import { LayoutDashboard, Gavel, UserRound, Shield, Users, RefreshCcw, Trophy, ListOrdered, Settings, ScrollText } from "lucide-react";
import { RequireRole, AppShell } from "@/components/shared";
import { LiveProvider } from "@/contexts/LiveContext";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/auction", label: "Auction control", icon: Gavel },
  { href: "/admin/players", label: "Players", icon: UserRound },
  { href: "/admin/teams", label: "Teams", icon: Shield },
  { href: "/admin/captains", label: "Captains", icon: Users },
  { href: "/admin/resale", label: "Resale requests", icon: RefreshCcw },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: ListOrdered },
  { href: "/admin/results", label: "Results", icon: Trophy },
  { href: "/admin/logs", label: "History & logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
  return (
    <RequireRole role="ADMIN">
      <LiveProvider>
        <AppShell nav={NAV} title="Administrator">{children}</AppShell>
      </LiveProvider>
    </RequireRole>
  );
}
