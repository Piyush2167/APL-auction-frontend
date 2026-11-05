"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuctionLive } from "@/hooks/useAuctionLive";
import { get } from "@/services/api/client";
import { Card, StatusBadge, Skeleton, EmptyState, points } from "@/components/ui";
import { ConnectionBadge, ViewerCount, TeamLogo, PlayerImage, Logo } from "@/components/shared";
import { PlayerCard, BidSummary, BidHistory, StatusBanner, LastResult } from "@/components/auction";

function PublicTeams({ refreshKey }) {
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => get("/public/teams").then(setTeams).catch(() => setError(true)), []);
  useEffect(() => { load(); }, [load, refreshKey]);
  if (error && !teams) return <p className="text-sm text-muted">Team information is unavailable right now.</p>;
  if (!teams) return <Skeleton rows={3} />;
  if (!teams.length) return <EmptyState title="No teams announced yet" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {teams.map((t) => (
        <div key={t.id} className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo team={t} size={32} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{t.name}</p>
              <p className="truncate text-xs text-muted">{t.captainName ? `Captain ${t.captainName}` : "Captain to be announced"}</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-1 text-xs">
            <dt className="text-muted">Squad</dt><dd className="text-right tabular-nums">{t.playersPurchased}/{t.maxSquadSize}</dd>
            {t.remainingPurse != null && <><dt className="text-muted">Purse left</dt><dd className="text-right tabular-nums">{points(t.remainingPurse)}</dd></>}
          </dl>
          <ul className="mt-3 flex flex-col gap-1.5">
            {t.squad.map((p) => (
              <li key={p.id} className="flex min-w-0 items-center gap-2 text-sm">
                <PlayerImage player={p} size={24} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-muted tabular-nums">{p.purchasePrice}</span>
              </li>
            ))}
            {!t.squad.length && <li className="text-xs text-muted">No players yet</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function AudienceLive() {
  const [teamsKey, setTeamsKey] = useState(0);
  const onEvent = useCallback((type) => {
    if (["player:sold", "resale:approved", "auction:started"].includes(type)) setTeamsKey((k) => k + 1);
  }, []);
  const { state, counts, connection, clockOffset } = useAuctionLive({ onEvent });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a href="/" className="flex min-w-0 items-center gap-3"><Logo /><span className="truncate text-sm text-muted">{state?.season?.name}</span></a>
          {state && state.status !== "NO_SEASON" && <StatusBadge status={state.status} />}
        </div>
        <div className="flex items-center gap-4"><ViewerCount counts={counts} /><ConnectionBadge connection={connection} /></div>
      </header>
      {connection !== "connected" && state && (
        <p className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm text-warning" role="status">
          Connection lost. Showing the last known state while we reconnect…
        </p>
      )}

      <div className="grid gap-4 p-4 sm:p-6 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Left column: fixed-size player panel. Never resizes with bid history. */}
        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          {!state ? <Skeleton rows={6} /> : (
            <>
              <StatusBanner state={state} clockOffset={clockOffset} />
              <section aria-label="Current player" className="h-80 shrink-0 overflow-hidden rounded-xl border border-line bg-surface p-5 sm:h-64">
                {state.player ? <PlayerCard player={state.player} /> : (
                  <EmptyState title={state.status === "COMPLETED" ? "Auction complete" : "No player on the block"} description="The next player appears here as soon as the auctioneer selects them." />
                )}
              </section>
              {state.player && <BidSummary state={state} />}
              <LastResult result={state.lastResult} />
            </>
          )}
        </div>
        {/* Right column: bid history scrolls internally. */}
        <Card title="Bid history" className="h-96 lg:h-full" bodyClassName="p-0 min-h-0 flex-1 overflow-hidden">
          {state ? <BidHistory bids={state.bids} /> : <Skeleton rows={5} className="p-4" />}
        </Card>
      </div>

      <section className="p-4 sm:p-6" aria-labelledby="teams-h">
        <h2 id="teams-h" className="mb-3 text-lg font-semibold">Teams</h2>
        <PublicTeams refreshKey={teamsKey} />
      </section>
    </div>
  );
}
