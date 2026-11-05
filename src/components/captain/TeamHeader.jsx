"use client";
import { useLive } from "@/contexts/LiveContext";
import { Stat, Skeleton, Badge, points } from "@/components/ui";
import { TeamLogo } from "@/components/shared";

export default function TeamHeader() {
  const { team } = useLive();
  if (!team) return <Skeleton rows={2} />;
  const f = team.finance;
  const pendingResale = team.resaleRequests.find((r) => r.status === "PENDING");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <TeamLogo team={team.team} size={48} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{team.team.name}</h1>
          <p className="truncate text-sm text-muted">Captain {team.team.captain?.name}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Badge tone={team.mysteryToken.status === "AVAILABLE" ? "mystery" : "neutral"}>Mystery Token: {team.mysteryToken.status === "AVAILABLE" ? "available" : team.mysteryToken.status === "USED" ? "used" : "issued at start"}</Badge>
          {pendingResale && <Badge tone="primary">Resale pending</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Remaining purse" value={points(f.remainingPurse)} tone="primary" />
        <Stat label="Initial purse" value={points(f.initialPurse)} />
        <Stat label="Total spent" value={points(f.totalSpent)} />
        <Stat label="Resale credits" value={points(f.totalResaleCredits)} />
        <Stat label="Players" value={`${f.playersPurchased}/${f.maxSquadSize}`} hint={`${f.squadCompletion}% complete`} />
        <Stat label="Slots left" value={f.playersRemaining} />
      </div>
    </div>
  );
}
