"use client";
import { Table, Th, Td, Skeleton, EmptyState, cx } from "@/components/ui";
import { TeamLogo } from "@/components/shared";

export default function LeaderboardTable({ rows, highlightTeamId }) {
  if (!rows) return <Skeleton rows={4} />;
  if (!rows.length) return <EmptyState title="No teams yet" description="Teams appear here once the administrator creates them." />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Team</Th><Th>Captain</Th><Th num>Initial</Th><Th num>Spent</Th><Th num>Resale credits</Th>
          <Th num>Remaining</Th><Th num>Players</Th><Th num>Slots left</Th><Th>Squad</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className={cx(r.id === highlightTeamId && "bg-primary/10")}>
            <Td><span className="flex min-w-36 items-center gap-2"><TeamLogo team={r} size={28} /><span className="truncate font-medium">{r.name}</span></span></Td>
            <Td className="max-w-40 truncate text-muted">{r.captainName || "—"}</Td>
            <Td num>{r.initialPurse}</Td>
            <Td num>{r.totalSpent}</Td>
            <Td num>{r.totalResaleCredits}</Td>
            <Td num className="font-semibold text-accent">{r.remainingPurse}</Td>
            <Td num>{r.playersPurchased}/{r.maxSquadSize}</Td>
            <Td num>{r.playersRemaining}</Td>
            <Td>
              <div className="flex min-w-24 items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-surface-2" role="progressbar" aria-valuenow={r.squadCompletion} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.name} squad completion`}>
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${r.squadCompletion}%` }} />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted">{r.squadCompletion}%</span>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
