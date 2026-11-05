"use client";
import Link from "next/link";
import { useLive } from "@/contexts/LiveContext";
import { useResource } from "@/hooks/useResource";
import { Card, Stat, PageHeader, Skeleton, ErrorState, EmptyState, StatusBadge, Badge, points, dateTime, Table, Th, Td } from "@/components/ui";
import { PlayerImage, TeamLogo, ConnectionBadge } from "@/components/shared";
import { BidSummary, PlayerCard, StatusBanner } from "@/components/auction";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

const label = (t) => t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const SPORT = { CRICKET: { label: "Cricket", tone: "info" }, FOOTBALL: { label: "Football", tone: "success" } };
const SportBadge = ({ sport }) => <Badge tone={SPORT[sport]?.tone}>{SPORT[sport]?.label || sport}</Badge>;

/** Every auction (active and archived) with headline numbers. */
function AllAuctions({ refreshKey }) {
  const { data, error, reload } = useResource("/admin/auctions", undefined, refreshKey);
  return (
    <Card title="All auctions">
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={3} /> : !data.length ? (
        <p className="text-sm text-muted">No auctions created yet.</p>
      ) : (
        <Table>
          <thead><tr><Th>Auction</Th><Th>Sport</Th><Th>Status</Th><Th num>Teams</Th><Th num>Players</Th><Th num>Sold</Th><Th num>Total spent</Th><Th>Created</Th></tr></thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className={a.active ? "bg-primary/10" : undefined}>
                <Td><span className="flex min-w-40 flex-wrap items-center gap-2"><span className="font-medium">{a.name}</span><span className="text-xs text-muted">{a.year}</span>{a.active ? <Badge tone="primary">Current</Badge> : <Badge>Archived</Badge>}</span></Td>
                <Td><SportBadge sport={a.sport} /></Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td num>{a.teams}</Td>
                <Td num>{a.players}</Td>
                <Td num>{a.sold}</Td>
                <Td num>{points(a.totalSpent)}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{dateTime(a.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const { state, leaderboard, counts, connection, clockOffset, lastEvent } = useLive();
  const refreshKey = `${state?.version}:${lastEvent?.at}`;
  const { data, error, reload } = useResource("/admin/dashboard", undefined, refreshKey);

  if (error?.code === "NO_SEASON") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <Card><EmptyState title="No active auction" description="Create a cricket or football auction in Settings to get started." action={<Link href="/admin/settings" className="text-accent underline">Create an auction</Link>} /></Card>
        <AllAuctions refreshKey={refreshKey} />
      </div>
    );
  }
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={8} />;
  const s = data.stats;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={data.auction ? data.auction.name : "Dashboard"}
        description={data.auction ? `${SPORT[data.auction.sport]?.label || ""} auction · ${data.auction.year} · live overview, all figures from the server` : undefined}
        actions={<>{data.auction && <SportBadge sport={data.auction.sport} />}<StatusBadge status={s.auctionStatus} /><ConnectionBadge connection={connection} /></>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Registered players" value={s.totalPlayers} />
        <Stat label="Teams" value={s.totalTeams} hint={`${s.totalCaptains} active captains`} />
        <Stat label="Available" value={s.available} />
        <Stat label="Sold" value={s.sold} tone="success" />
        <Stat label="Unsold" value={s.unsold} tone="danger" />
        <Stat label="Skipped" value={s.skipped} tone="warning" />
        <Stat label="Remaining pool" value={s.remainingPool} />
        <Stat label="Mystery players" value={s.mysteryPlayers} />
        <Stat label="Pending resale" value={s.pendingResale} tone={s.pendingResale ? "primary" : undefined} />
        <Stat label="Transactions" value={s.totalTransactions} />
        <Stat label="Captains online" value={counts?.captains ?? s.connectedCaptains} />
        <Stat label="Audience viewers" value={counts?.audience ?? s.audienceViewers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Current auction" actions={<Link href="/admin/auction" className="text-sm text-accent hover:underline">Open control panel</Link>}>
          <div className="flex flex-col gap-4">
            <StatusBanner state={state} clockOffset={clockOffset} />
            {state?.player ? <><PlayerCard player={state.player} compact /><BidSummary state={state} /></> : <p className="text-sm text-muted">No player is active.</p>}
          </div>
        </Card>
        <Card title="Recent purchases">
          {!data.recentPurchases.length ? <p className="text-sm text-muted">No purchases yet.</p> : (
            <ul className="flex flex-col">
              {data.recentPurchases.map((r, i) => (
                <li key={i} className="flex min-w-0 items-center gap-3 border-b border-line/60 py-2">
                  <PlayerImage player={r.player} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm">{r.player?.name}</span>
                  <TeamLogo team={r.team} size={24} />
                  <span className="w-20 text-right text-sm font-medium tabular-nums">{points(r.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Team financial leaderboard"><LeaderboardTable rows={leaderboard || data.leaderboard} /></Card>
        <Card title="Player status distribution">
          <Table><tbody>
            {Object.entries(data.statusDistribution).sort().map(([k, v]) => (
              <tr key={k}><Td><StatusBadge status={k} /></Td><Td num>{v}</Td></tr>
            ))}
          </tbody></Table>
        </Card>
      </div>

      <Card title="Recent activity" actions={<Link href="/admin/logs" className="text-sm text-accent hover:underline">All logs</Link>}>
        {!data.recentActivity.length ? <p className="text-sm text-muted">No activity yet.</p> : (
          <ul className="flex flex-col text-sm">
            {data.recentActivity.map((l) => (
              <li key={l.id} className="flex min-w-0 flex-wrap items-center gap-x-3 border-b border-line/60 py-2">
                <span className="font-medium">{label(l.type)}</span>
                <span className="text-muted">{l.actor.name}</span>
                <span className="ml-auto text-xs text-muted tabular-nums">{dateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AllAuctions refreshKey={refreshKey} />
    </div>
  );
}
