"use client";
import { useEffect, useState } from "react";
import { Gavel, Lock, PauseCircle, Trophy, XCircle, SkipForward, Clock, HelpCircle } from "lucide-react";
import { Badge, StatusBadge, points, timeOnly, cx } from "@/components/ui";
import { PlayerImage, TeamLogo } from "@/components/shared";

/** Seconds remaining until a server deadline, corrected for client clock skew. */
export function useCountdown(deadline, clockOffset = 0) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return undefined;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - (now + clockOffset)) / 1000));
}

/** Current player. Fixed layout: its size never depends on bid history. */
export function PlayerCard({ player, compact = false, showPrivate = false }) {
  if (!player) return null;
  const mystery = player.playerType === "MYSTERY";
  const size = compact ? 72 : 144;
  return (
    <div className={cx("flex min-w-0 gap-4", compact ? "items-center" : "flex-col items-center text-center sm:flex-row sm:items-start sm:text-left")}>
      <PlayerImage player={player} size={size} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 max-sm:justify-center">
          {mystery && <Badge tone="mystery"><HelpCircle className="size-3" aria-hidden />Mystery Player</Badge>}
          {player.revealedToYou && <Badge tone="success">Revealed to your team</Badge>}
          <Badge tone="info">{player.category}</Badge>
          {player.gender && <Badge>{player.gender}</Badge>}
        </div>
        <h2 className={cx("truncate font-bold", compact ? "text-lg" : "text-3xl")} title={player.name}>{player.name}</h2>
        {!compact && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {player.battingStyle && <><dt className="text-muted">Batting</dt><dd className="truncate">{player.battingStyle}</dd></>}
            {player.bowlingStyle && <><dt className="text-muted">Bowling</dt><dd className="truncate">{player.bowlingStyle}</dd></>}
            {player.experience && <><dt className="text-muted">Experience</dt><dd className="truncate">{player.experience}</dd></>}
            <dt className="text-muted">Base price</dt><dd className="tabular-nums">{points(player.basePrice)}</dd>
          </dl>
        )}
        {player.skills?.length > 0 && (
          <ul className="flex max-h-16 flex-wrap gap-1.5 overflow-hidden max-sm:justify-center" aria-label="Skills">
            {player.skills.map((s) => <li key={s}><Badge>{s}</Badge></li>)}
          </ul>
        )}
        {showPrivate && mystery && player.publicSkills && (
          <p className="text-xs text-muted">Public skills: {player.publicSkills.join(", ") || "none approved"}</p>
        )}
      </div>
    </div>
  );
}

export function BidSummary({ state }) {
  const hasBid = state?.currentBid != null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 rounded-xl bg-surface-2 p-4 sm:col-span-1">
        <p className="text-xs text-muted">{hasBid ? "Current bid" : "Base price"}</p>
        <p className="mt-1 font-display text-5xl tabular-nums text-accent">{points(hasBid ? state.currentBid : state?.basePrice)}</p>
      </div>
      <div className="min-w-0 rounded-xl bg-surface-2 p-4">
        <p className="text-xs text-muted">Leading team</p>
        {state?.leadingTeam ? (
          <p className="mt-2 flex min-w-0 items-center gap-2 font-semibold"><TeamLogo team={state.leadingTeam} size={28} /><span className="truncate">{state.leadingTeam.name}</span></p>
        ) : <p className="mt-2 text-muted">No bids yet</p>}
      </div>
      <div className="rounded-xl bg-surface-2 p-4">
        <p className="text-xs text-muted">Next valid bid</p>
        <p className="mt-1 font-display text-2xl tabular-nums">{points(state?.nextValidBid)}</p>
        <p className="text-xs text-muted tabular-nums">+{state?.increment} per step · {state?.bidCount || 0} bids</p>
      </div>
    </div>
  );
}

/** Bid list that scrolls inside its own box; parent must give it a bounded height. */
export function BidHistory({ bids }) {
  if (!bids?.length) {
    return <div className="grid h-full place-items-center p-6 text-center text-sm text-muted">No bids yet for this player.</div>;
  }
  return (
    <ol className="h-full min-h-0 overflow-y-auto overscroll-contain" aria-label="Bid history" aria-live="polite">
      {bids.map((b, i) => (
        <li key={b.id || b.seq} className={cx("flex items-center gap-3 border-b border-line/60 px-4 py-2.5", i === 0 && "bg-primary/10")}>
          <TeamLogo team={b.team} size={28} />
          <span className="min-w-0 flex-1 truncate text-sm">{b.team?.name}</span>
          <span className="font-semibold tabular-nums">{points(b.amount)}</span>
          <span className="w-20 text-right text-xs text-muted tabular-nums">{timeOnly(b.at)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Explains the current auction situation in one line. Covers every state so the screen is never blank. */
export function StatusBanner({ state, clockOffset }) {
  const left = useCountdown(state?.finalization?.deadline, clockOffset);
  if (!state) return null;
  const base = "flex min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-sm";
  if (state.status === "FINALIZING") {
    return (
      <div className={cx(base, "border-warning/50 bg-warning/10 text-warning")} role="status">
        <Lock className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">Bidding closed. Selling to <b>{state.finalization?.team?.name}</b> for <b className="tabular-nums">{points(state.finalization?.amount)}</b></span>
        <span className="text-2xl font-bold tabular-nums" aria-label={`${left} seconds`}>{left ?? ""}</span>
      </div>
    );
  }
  if (state.status === "PAUSED") return <div className={cx(base, "border-warning/50 bg-warning/10 text-warning")} role="status"><PauseCircle className="size-5" aria-hidden />The auction is paused.</div>;
  if (state.status === "COMPLETED") return <div className={cx(base, "border-line bg-surface-2")} role="status"><Trophy className="size-5 text-accent" aria-hidden />The auction is complete. Thank you for watching.</div>;
  if (["CREATED", "READY", "NO_SEASON"].includes(state.status)) return <div className={cx(base, "border-line bg-surface-2")} role="status"><Clock className="size-5 text-muted" aria-hidden />The auction has not started yet.</div>;
  if (state.player && state.biddingOpen) return <div className={cx(base, "border-success/40 bg-success/10 text-success")} role="status"><Gavel className="size-5" aria-hidden />Bidding is open.</div>;
  if (state.player) return <div className={cx(base, "border-info/40 bg-info/10 text-info")} role="status"><Clock className="size-5" aria-hidden />Player up next. Bidding opens shortly.</div>;
  return <div className={cx(base, "border-line bg-surface-2")} role="status"><Clock className="size-5 text-muted" aria-hidden />Waiting for the next player.</div>;
}

export function LastResult({ result }) {
  if (!result) return null;
  const Icon = { SOLD: Trophy, UNSOLD: XCircle, SKIPPED: SkipForward }[result.outcome];
  const tone = { SOLD: "text-success", UNSOLD: "text-danger", SKIPPED: "text-warning" }[result.outcome];
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-surface-2 p-3">
      <Icon className={cx("size-6 shrink-0", tone)} aria-hidden />
      <PlayerImage player={result.player} size={40} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-semibold">{result.player?.name}</p>
        <p className="truncate text-muted">
          {result.outcome === "SOLD" ? <>Sold to <b className="text-fg">{result.team?.name}</b> for <b className="text-fg tabular-nums">{points(result.amount)}</b></> : result.outcome === "UNSOLD" ? "Unsold" : "Skipped"}
        </p>
      </div>
      <StatusBadge status={result.outcome} />
    </div>
  );
}
