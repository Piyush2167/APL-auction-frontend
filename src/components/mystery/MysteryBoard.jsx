"use client";
import { Gavel, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuctionLive } from "@/hooks/useAuctionLive";
import { useResource } from "@/hooks/useResource";
import { Badge, StatusBadge, Skeleton, ErrorState, EmptyState, points, cx } from "@/components/ui";
import { ConnectionBadge, PlayerImage, TeamLogo, Logo } from "@/components/shared";

/**
 * All MYSTERY players as cards. The player currently on the block is marked "In Auction".
 * Public viewers get masked data from the public API; signed-in admins see full identities.
 */
export default function MysteryBoard() {
  const { status, user } = useAuth();
  const isAdmin = status === "authenticated" && user?.role === "ADMIN" && !user.mustChangePassword;
  const { state, connection } = useAuctionLive();
  const url = status === "loading" ? null : isAdmin ? "/admin/players" : "/public/players";
  // Refetch whenever the live auction state changes (player selected, sold, unsold...).
  const { data, error, reload } = useResource(url, { playerType: "MYSTERY", limit: 200 }, state?.version);
  const activeId = state?.player && ["LIVE", "PAUSED", "FINALIZING"].includes(state.status) ? state.player.id : null;
  const players = data?.rows;

  return (
    <main className="mx-auto min-h-dvh max-w-7xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <a href="/"><Logo /></a>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><HelpCircle className="size-6 text-mystery" aria-hidden />Mystery Players</h1>
          <p className="mt-1 text-sm text-muted">
            {players ? `${players.length} mystery player${players.length === 1 ? "" : "s"}` : "Loading…"}
            {isAdmin && " · Admin view: real identities shown"}
          </p>
        </div>
        <ConnectionBadge connection={connection} />
      </header>

      {error?.code === "NO_SEASON" ? <EmptyState icon={HelpCircle} title="The auction hasn't been set up yet" description="Mystery players appear here once they are registered." />
        : error && !data ? <ErrorState error={error} onRetry={reload} /> : !players ? <Skeleton rows={4} /> : !players.length ? (
        <EmptyState icon={HelpCircle} title="No mystery players" description="Players registered as MYSTERY appear here." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((p) => {
            const live = p.id === activeId;
            return (
              <li key={p.id} className={cx("relative flex min-w-0 flex-col rounded-xl border bg-surface p-4", live ? "border-primary ring-2 ring-primary/50" : "border-line")}>
                {live && (
                  <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-fg">
                    <Gavel className="size-3.5" aria-hidden />In Auction
                  </span>
                )}
                <div className="flex min-w-0 items-center gap-3">
                  <PlayerImage player={p} size={64} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold" title={p.name}>{p.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1"><Badge tone="mystery">Mystery</Badge><Badge tone="info">{p.category}</Badge></div>
                  </div>
                </div>
                {(p.skills?.length > 0) && (
                  <ul className="mt-3 flex flex-wrap gap-1" aria-label="Skills">{p.skills.map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul>
                )}
                <dl className="mt-auto grid grid-cols-2 gap-1 pt-4 text-sm">
                  <dt className="text-muted">Base price</dt><dd className="text-right tabular-nums">{points(p.basePrice)}</dd>
                  {live && state?.currentBid != null && <><dt className="text-muted">Current bid</dt><dd className="text-right font-semibold tabular-nums text-accent">{points(state.currentBid)}</dd></>}
                  <dt className="text-muted">Status</dt><dd className="text-right">{live ? <Badge tone="primary">In Auction</Badge> : <StatusBadge status={p.status} />}</dd>
                  {p.currentTeam?.name && <><dt className="text-muted">Team</dt><dd className="flex min-w-0 items-center justify-end gap-1"><TeamLogo team={p.currentTeam} size={18} /><span className="truncate">{p.currentTeam.name}</span></dd></>}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
