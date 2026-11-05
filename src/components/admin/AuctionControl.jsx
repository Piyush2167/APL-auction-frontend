"use client";
import { useState } from "react";
import Link from "next/link";
import { Play, Pause, Gavel, XCircle, SkipForward, ChevronRight, CheckCircle2, Flag } from "lucide-react";
import { useLive } from "@/contexts/LiveContext";
import { useToast } from "@/contexts/ToastContext";
import { useAction, useResource } from "@/hooks/useResource";
import { post } from "@/services/api/client";
import { Button, Card, StatusBadge, ConfirmDialog, EmptyState, Skeleton, Badge, points, Table, Th, Td, Input } from "@/components/ui";
import { ConnectionBadge, ViewerCount, PlayerImage } from "@/components/shared";
import { PlayerCard, BidSummary, BidHistory, StatusBanner, LastResult } from "@/components/auction";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

function PlayerPicker({ players, onPick, pending, disabled, emptyText }) {
  const [q, setQ] = useState("");
  const list = (players || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  if (!players) return <Skeleton rows={3} />;
  if (!players.length) return <p className="py-4 text-center text-sm text-muted">{emptyText}</p>;
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <Input type="search" placeholder="Search players" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search players" />
      <ul className="max-h-72 overflow-y-auto">
        {list.map((p) => (
          <li key={p.id} className="flex min-w-0 items-center gap-3 border-b border-line/60 py-2">
            <PlayerImage player={p} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}{p.playerType === "MYSTERY" && <Badge tone="mystery" className="ml-2">Mystery</Badge>}</p>
              <p className="text-xs text-muted">#{p.auctionOrder} · {p.category} · {points(p.basePrice)}</p>
            </div>
            <Button size="sm" disabled={disabled} pending={pending === `select:${p.id}`} onClick={() => onPick(p)}>Select</Button>
          </li>
        ))}
        {!list.length && <li className="py-4 text-center text-sm text-muted">No players match “{q}”.</li>}
      </ul>
    </div>
  );
}

export default function AuctionControl() {
  const { state, leaderboard, connection, counts, clockOffset, lastEvent } = useLive();
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const [confirm, setConfirm] = useState(null);
  const pendingPlayers = useResource("/admin/auction/pending-players", undefined, state?.version);
  const tokens = useResource("/admin/mystery-tokens", undefined, `${state?.version}:${lastEvent?.at}`);



  if (!state) return <Skeleton rows={8} />;
  if (state.status === "NO_SEASON" || ["CREATED", "READY"].includes(state.status)) {
    return (
      <Card>
        <EmptyState title={state.status === "READY" ? "Ready to start" : "The auction is not set up yet"}
          description={state.status === "READY" ? "Configuration is confirmed. Start the auction from Settings." : "Create the auction, teams, captains and players, then confirm the configuration in Settings."}
          action={<Link href="/admin/settings" className="text-accent underline">Go to Settings</Link>} />
      </Card>
    );
  }

  const act = (name, url, msg) => run(name, () => post(url), msg);
  const live = state.status === "LIVE";
  const finalizing = state.status === "FINALIZING";
  const hasPlayer = !!state.player;
  const canSelect = live && !hasPlayer;
  const pp = pendingPlayers.data;

  const confirms = {
    sold: { title: "Mark player SOLD?", message: `${state.player?.name} will be sold to ${state.leadingTeam?.name} for ${points(state.currentBid)}${state.finalizationSeconds ? ` after a ${state.finalizationSeconds}-second countdown (bidding locks immediately)` : ""}.`, confirmLabel: "Confirm sale", tone: "success", go: () => act("sold", "/admin/auction/sold", state.finalizationSeconds ? "Sale is finalizing" : `Sold to ${state.leadingTeam?.name} for ${points(state.currentBid)}`) },
    unsold: { title: "Mark player UNSOLD?", message: `${state.player?.name} will be moved to the pending UNSOLD list. No money moves.`, confirmLabel: "Mark unsold", tone: "danger", go: () => act("unsold", "/admin/auction/unsold", "Player marked unsold") },
    skip: { title: "Skip this player?", message: `${state.player?.name} will be moved to the pending SKIPPED list.`, confirmLabel: "Skip player", tone: "primary", go: () => act("skip", "/admin/auction/skip", "Player skipped") },
    complete: { title: "Complete the auction?", message: "This ends the auction. No further players can be selected.", confirmLabel: "Complete auction", tone: "danger", go: () => act("complete", "/admin/auction/complete", "Auction completed") },
  };
  const c = confirm && confirms[confirm];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Auction control</h1>
          <StatusBadge status={state.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewerCount counts={counts} />
          <ConnectionBadge connection={connection} />
          {live && <Button size="sm" pending={pending === "pause"} onClick={() => act("pause", "/admin/auction/pause", "Auction paused")}><Pause className="size-4" aria-hidden />Pause</Button>}
          {state.status === "PAUSED" && <Button size="sm" variant="primary" pending={pending === "resume"} onClick={() => act("resume", "/admin/auction/resume", "Auction resumed")}><Play className="size-4" aria-hidden />Resume</Button>}
          {(live || state.status === "PAUSED") && !hasPlayer && <Button size="sm" variant="ghost" onClick={() => setConfirm("complete")}><Flag className="size-4" aria-hidden />Complete auction</Button>}
        </div>
      </div>
      {connection !== "connected" && <p role="alert" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">Live connection lost. Controls still work, but the display may lag until reconnected.</p>}

      <StatusBanner state={state} clockOffset={clockOffset} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Current player">
            <div className="min-h-56">
              {hasPlayer ? <PlayerCard player={state.player} showPrivate /> : <EmptyState title="No active player" description={canSelect ? "Select the next player below." : "Resume the auction to select a player."} />}
            </div>
          </Card>

          {hasPlayer && (
            <Card title="Bidding">
              <BidSummary state={state} />
              <div className="mt-4 flex flex-wrap gap-2">
                {!state.biddingOpen && !finalizing && (
                  <Button variant="primary" size="lg" disabled={!live} pending={pending === "bidding"} onClick={() => act("bidding", "/admin/auction/start-bidding", "Bidding opened")}>
                    <Gavel className="size-5" aria-hidden />Start bidding
                  </Button>
                )}
                {state.biddingOpen && (
                  <Button variant="success" size="lg" disabled={!live || !state.leadingTeam} pending={pending === "sold"} onClick={() => setConfirm("sold")}
                    title={!state.leadingTeam ? "No valid bid yet: use UNSOLD" : undefined}>
                    <CheckCircle2 className="size-5" aria-hidden />SOLD
                  </Button>
                )}
                <Button variant="danger" size="lg" disabled={finalizing || !["LIVE", "PAUSED"].includes(state.status)} pending={pending === "unsold"} onClick={() => setConfirm("unsold")}>
                  <XCircle className="size-5" aria-hidden />UNSOLD
                </Button>
                <Button size="lg" disabled={finalizing || state.bidCount > 0 || !["LIVE", "PAUSED"].includes(state.status)} pending={pending === "skip"} onClick={() => setConfirm("skip")}
                  title={state.bidCount > 0 ? "Bids exist: use SOLD or UNSOLD" : undefined}>
                  <SkipForward className="size-5" aria-hidden />Skip
                </Button>
              </div>
              {state.biddingOpen && !state.leadingTeam && <p className="mt-2 text-xs text-muted">SOLD is available once a valid bid exists.</p>}
            </Card>
          )}

          <LastResult result={state.lastResult} />

          <Card title="Select player" actions={
            <Button size="sm" variant="primary" disabled={!canSelect || !pp?.pool?.length} pending={pending === "next"} onClick={() => act("next", "/admin/auction/next-player", "Next player selected")}>
              Next in order<ChevronRight className="size-4" aria-hidden />
            </Button>
          }>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="min-w-0">
                <h3 className="mb-2 text-sm font-medium">Main pool <span className="text-muted tabular-nums">({pp?.pool?.length ?? "…"})</span></h3>
                <PlayerPicker players={pp?.pool} disabled={!canSelect} pending={pending} emptyText="The main pool is empty."
                  onPick={(p) => run(`select:${p.id}`, () => post("/admin/auction/select-player", { playerId: p.id }), `${p.name} selected`)} />
              </div>
              {["unsold", "skipped"].map((k) => (
                <div key={k} className="min-w-0">
                  <h3 className="mb-2 text-sm font-medium capitalize">Pending {k} <span className="text-muted tabular-nums">({pp?.[k]?.length ?? "…"})</span></h3>
                  {pp && !pp.pendingSelectable && pp[k].length > 0 && <p className="mb-2 text-xs text-warning">Available after the {pp.availableCount} remaining registered players are auctioned.</p>}
                  <PlayerPicker players={pp?.[k]} disabled={!canSelect || !pp?.pendingSelectable} pending={pending} emptyText={`No ${k} players.`}
                    onPick={(p) => run(`select:${p.id}`, () => post("/admin/auction/select-player", { playerId: p.id }), `${p.name} brought back`)} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title={`Bid history (${state.bidCount || 0})`} className="h-[28rem]" bodyClassName="min-h-0 flex-1 overflow-hidden p-0">
            <BidHistory bids={state.bids} />
          </Card>
          <Card title="Mystery tokens">
            {!tokens.data ? <Skeleton rows={2} /> : !tokens.data.length ? <p className="text-sm text-muted">Tokens are issued when the auction starts.</p> : (
              <Table><tbody>
                {tokens.data.map((t) => (
                  <tr key={t.team.id}><Td className="max-w-32 truncate">{t.team.name}</Td><Td><StatusBadge status={t.status === "USED" ? "SOLD" : "AVAILABLE"} /></Td><Td className="max-w-32 truncate text-xs text-muted">{t.revealedPlayer?.name || ""}</Td></tr>
                ))}
              </tbody></Table>
            )}
          </Card>
        </div>
      </div>

      <Card title="Team leaderboard"><LeaderboardTable rows={leaderboard} /></Card>

      <ConfirmDialog open={!!c} title={c?.title} message={c?.message} confirmLabel={c?.confirmLabel} tone={c?.tone} pending={!!pending}
        onClose={() => setConfirm(null)} onConfirm={async () => { await c.go(); setConfirm(null); }} />
    </div>
  );
}
