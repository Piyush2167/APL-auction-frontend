"use client";
import { useState } from "react";
import { Gavel, Eye, Lock } from "lucide-react";
import { useLive } from "@/contexts/LiveContext";
import { useToast } from "@/contexts/ToastContext";
import { post, apiError } from "@/services/api/client";
import { Button, Card, ConfirmDialog, Badge, points, cx } from "@/components/ui";
import { PlayerCard, BidSummary, StatusBanner } from "@/components/auction";
import { ConnectionBadge } from "@/components/shared";

/** Display-only eligibility; the backend re-validates every bid. */
export function eligibility(state, team) {
  if (!state || !team) return { ok: false, reason: "Loading…" };
  const f = team.finance;
  if (state.status === "FINALIZING") return { ok: false, reason: "Bidding is locked while the sale finalizes." };
  if (state.status === "PAUSED") return { ok: false, reason: "The auction is paused." };
  if (state.status !== "LIVE") return { ok: false, reason: "The auction is not live." };
  if (!state.player) return { ok: false, reason: "Waiting for the next player." };
  if (!state.biddingOpen) return { ok: false, reason: "Waiting for the auctioneer to open bidding." };
  if (state.leadingTeam?.id === team.team.id) return { ok: false, reason: "Your team holds the highest bid.", leading: true };
  if (f.playersRemaining <= 0) return { ok: false, reason: "Your squad is full." };
  if (f.remainingPurse < state.nextValidBid) return { ok: false, reason: `Not enough purse (${points(f.remainingPurse)} left).` };
  return { ok: true };
}

/** The current player as this captain may see it: revealed identity only if their token revealed this player. */
export function usePlayerForCaptain() {
  const { state, team } = useLive();
  const revealed = team?.mysteryToken?.revealedPlayer;
  if (state?.player && revealed && revealed.id === state.player.id) return { ...revealed, status: state.player.status };
  return state?.player;
}

export default function BidPanel() {
  const { state, team, emit, resync, connection, clockOffset } = useLive();
  const toast = useToast();
  const player = usePlayerForCaptain();
  const [bidding, setBidding] = useState(null); // the amount being sent
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const el = eligibility(state, team);
  // The server lists the bids allowed now: the base price first, then the current bid plus each increment (+3, +5).
  const options = state?.validBids ?? (state?.nextValidBid != null ? [state.nextValidBid] : []);
  const overPurse = (amount) => team && amount > team.finance.remainingPurse;

  const placeBid = async (amount) => {
    if (bidding != null || !el.ok) return;
    setBidding(amount);
    const res = await emit("bid:place", { playerId: state.player.id, amount, idempotencyKey: crypto.randomUUID() });
    setBidding(null);
    if (res?.ok) toast.success(`Bid of ${points(res.data.amount)} placed`);
    else { toast.error(res?.error?.message || "Bid failed"); resync(); }
  };

  const reveal = async () => {
    setRevealing(true);
    try {
      await post("/captain/mystery-token/reveal");
      toast.success("Mystery Player revealed to your team");
      setRevealOpen(false);
    } catch (e) { toast.error(apiError(e).message); } finally { setRevealing(false); }
  };

  const token = team?.mysteryToken;
  const canReveal = state?.player?.playerType === "MYSTERY" && state?.mysteryEnabled && token?.status === "AVAILABLE" && !player?.revealedToYou;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Live auction</h1>
        <ConnectionBadge connection={connection} />
      </div>
      <StatusBanner state={state} clockOffset={clockOffset} />
      <Card title="Current player">
        <div className="min-h-48">
          {player ? <PlayerCard player={player} /> : <p className="py-10 text-center text-sm text-muted">No player on the block yet.</p>}
        </div>
        {state?.player?.playerType === "MYSTERY" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-mystery/40 bg-mystery/10 p-3">
            {player?.revealedToYou ? <p className="text-sm text-mystery">You revealed this player with your Mystery Token. Only your team can see this identity.</p>
              : token?.status === "USED" ? <p className="text-sm text-muted">Your team has already used its Mystery Token in this auction.</p>
                : <>
                  <p className="min-w-0 flex-1 text-sm">Use your team&apos;s single Mystery Token for this auction to see who this is.</p>
                  <Button variant="outline" className="border-mystery/60 text-mystery" disabled={!canReveal} onClick={() => setRevealOpen(true)}><Eye className="size-4" aria-hidden />Reveal Mystery Player</Button>
                </>}
          </div>
        )}
      </Card>

      {state?.player && (
        <Card title="Bid">
          <BidSummary state={state} />
          <div className="mt-4 grid gap-3 sm:auto-cols-fr sm:grid-flow-col">
            {state.status === "FINALIZING" ? (
              <Button size="xl" variant="primary" disabled><Lock className="size-5" aria-hidden />Bidding locked</Button>
            ) : options.map((amount) => {
              const raise = state.currentBid != null ? amount - state.currentBid : null;
              return (
                <Button key={amount} size="xl" variant="primary" disabled={!el.ok || overPurse(amount) || connection !== "connected" || (bidding != null && bidding !== amount)}
                  pending={bidding === amount} onClick={() => placeBid(amount)}>
                  <Gavel className="size-5" aria-hidden />
                  {raise != null && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-base tabular-nums">+{raise}</span>}
                  <span className="tabular-nums">Bid {points(amount)}</span>
                </Button>
              );
            })}
          </div>
          <p className={cx("mt-3 text-sm", el.ok ? "text-success" : el.leading ? "text-accent" : "text-muted")} role="status">
            {el.ok ? "You can bid." : el.reason}
            {connection !== "connected" && " · Reconnecting, bidding is paused on this device."}
          </p>
          {team && <p className="mt-1 text-xs text-muted tabular-nums">Your purse: {points(team.finance.remainingPurse)} · Slots left: {team.finance.playersRemaining}</p>}
        </Card>
      )}

      <ConfirmDialog open={revealOpen} title="Use your Mystery Token?" confirmLabel="Use token and reveal" pending={revealing} tone="primary"
        message="Each team has ONE Mystery Token for the whole auction. It cannot be restored. The identity is shown only to your team."
        onClose={() => setRevealOpen(false)} onConfirm={reveal} />
      {token?.status === "AVAILABLE" && <Badge tone="mystery" className="self-start">Mystery Token available</Badge>}
    </div>
  );
}
