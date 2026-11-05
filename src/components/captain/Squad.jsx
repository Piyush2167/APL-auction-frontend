"use client";
import { useState } from "react";
import { useLive } from "@/contexts/LiveContext";
import { useToast } from "@/contexts/ToastContext";
import { useAction } from "@/hooks/useResource";
import { post } from "@/services/api/client";
import { Button, Card, Skeleton, EmptyState, StatusBadge, Badge, ConfirmDialog, points } from "@/components/ui";
import { PlayerImage } from "@/components/shared";

export default function Squad({ allowResale = true }) {
  const { team, state } = useLive();
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const [target, setTarget] = useState(null);
  if (!team) return <Skeleton rows={4} />;
  const hasPending = team.resaleRequests.some((r) => r.status === "PENDING");
  const resaleOn = state?.resaleEnabled !== false;

  return (
    <Card title={`Squad (${team.squad.length}/${team.finance.maxSquadSize})`}>
      {!team.squad.length ? <EmptyState title="No players yet" description="Players you buy appear here." /> : (
        <ul className="flex flex-col">
          {team.squad.map((p) => (
            <li key={p.id} className="flex min-w-0 flex-wrap items-center gap-3 border-b border-line/60 py-3">
              <PlayerImage player={p} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted">{p.category}{p.playerType === "MYSTERY" && <Badge tone="mystery" className="ml-2">Mystery</Badge>}</p>
              </div>
              <StatusBadge status={p.status} />
              <span className="w-20 text-right font-semibold tabular-nums">{points(p.purchasePrice)}</span>
              {allowResale && resaleOn && p.resaleEligible && (
                <Button size="sm" disabled={hasPending} title={hasPending ? "You already have a pending request" : undefined} onClick={() => setTarget(p)}>Request resale</Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {allowResale && resaleOn && team.squad.length > 0 && (
        <p className="mt-3 text-xs text-muted">Only your highest-priced player can be resold (any of them if tied). The refund equals the purchase price and is credited only after the administrator approves.</p>
      )}
      <ConfirmDialog open={!!target} title={`Request resale of ${target?.name}?`} confirmLabel="Send request" pending={pending === "resale"}
        message={`If approved, ${points(target?.purchasePrice)} is credited back to your purse and the player leaves your squad. Until then the player stays in your squad.`}
        onClose={() => setTarget(null)}
        onConfirm={async () => { const r = await run("resale", () => post("/captain/resale", { playerId: target.id }), "Resale request sent to the administrator"); if (r.ok) setTarget(null); }} />
    </Card>
  );
}
