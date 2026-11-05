"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Wifi, WifiOff, Loader2, HelpCircle, Users, Eye } from "lucide-react";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { Spinner, cx, Badge } from "@/components/ui";

/** Client-side guard. The backend enforces every permission independently. */
export function RequireRole({ role, children }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ok = status === "authenticated" && user.role === role && !user.mustChangePassword;
  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && !ok) router.replace(homeFor(user));
  }, [status, ok, user, router, pathname]);
  if (!ok) return <div className="grid min-h-dvh place-items-center"><Spinner label="Checking your session" /></div>;
  return children;
}

export function AppShell({ nav, title, children }) {
  const { user, team, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Menu is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;
  const setOpen = (fn) => setOpenOn((fn(open) ? pathname : null));
  const links = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", active ? "bg-surface-2 font-medium text-fg shadow-[inset_3px_0_0_var(--color-primary)]" : "text-muted hover:bg-surface-2 hover:text-fg")}>
            <Icon className="size-4 shrink-0" aria-hidden />{label}
          </Link>
        );
      })}
    </nav>
  );
  const footer = (
    <div className="border-t border-line pt-3 text-sm">
      <p className="truncate font-medium">{user?.name}</p>
      <p className="truncate text-xs text-muted">{team ? team.name : user?.email}</p>
      <button type="button" onClick={async () => { await logout(); router.replace("/login"); }}
        className="mt-2 flex items-center gap-2 text-muted hover:text-fg"><LogOut className="size-4" aria-hidden />Sign out</button>
    </div>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="no-print hidden border-r border-line bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-6">
        <a href="/"><Logo /></a>
        <p className="-mt-4 text-xs text-muted">{title}</p>
        <div className="min-h-0 flex-1 overflow-y-auto">{links}</div>
        {footer}
      </aside>
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="rounded-md p-2 hover:bg-surface-2">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {open && <div className="no-print border-b border-line bg-surface p-4 lg:hidden">{links}<div className="mt-4">{footer}</div></div>}
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

export function ConnectionBadge({ connection }) {
  if (connection === "connected") return <Badge tone="success"><Wifi className="size-3" aria-hidden />Live</Badge>;
  if (connection === "connecting") return <Badge tone="neutral"><Loader2 className="size-3 animate-spin" aria-hidden />Connecting</Badge>;
  if (connection === "reconnecting") return <Badge tone="warning"><Loader2 className="size-3 animate-spin" aria-hidden />Reconnecting</Badge>;
  return <Badge tone="danger"><WifiOff className="size-3" aria-hidden />Offline</Badge>;
}

export function ViewerCount({ counts }) {
  if (!counts) return null;
  return (
    <span className="inline-flex items-center gap-3 text-xs text-muted tabular-nums">
      <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden />{counts.audience} watching</span>
      <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{counts.captains} captains online</span>
    </span>
  );
}

/** Player/mystery image with fixed dimensions (no layout shift). Masked mystery players never get a real image. */
export function PlayerImage({ player, size = 64, className }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (player?.identityHidden) {
    return (
      <div style={style} className={cx("grid shrink-0 place-items-center rounded-lg border border-mystery/40 bg-mystery/10 text-mystery", className)} role="img" aria-label="Mystery player">
        <HelpCircle style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden />
      </div>
    );
  }
  if (!player?.image || failed) {
    const initials = (player?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    return <div style={style} className={cx("grid shrink-0 place-items-center rounded-lg bg-surface-2 font-semibold text-muted", className)} role="img" aria-label={player?.name || "Player"}><span style={{ fontSize: size * 0.32 }}>{initials}</span></div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={player.image} alt={player.name} width={size} height={size} loading="lazy" onError={() => setFailed(true)} style={style} className={cx("shrink-0 rounded-lg object-cover", className)} />;
}

export function TeamLogo({ team, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (team?.logo && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.logo} alt="" width={size} height={size} onError={() => setFailed(true)} style={style} className="shrink-0 rounded-md object-cover" />;
  }
  return <span style={style} aria-hidden className="grid shrink-0 place-items-center rounded-md bg-ink text-[10px] font-medium text-white">{team?.abbreviation || "?"}</span>;
}

/** The APL mark and name, as on the landing page. */
export function Logo({ className }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display text-xl tracking-tight text-fg", className)}>
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-fg">A</span>APL Auction
    </span>
  );
}
