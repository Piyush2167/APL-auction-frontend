"use client";
import { useLive } from "@/contexts/LiveContext";
import { Card } from "@/components/ui";
import TeamHeader from "@/components/captain/TeamHeader";
import BidPanel from "@/components/captain/BidPanel";
import Squad from "@/components/captain/Squad";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function Page() {
  const { leaderboard, team } = useLive();
  return (
    <div className="flex flex-col gap-6">
      <TeamHeader />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <BidPanel />
        <Squad />
      </div>
      <Card title="Team leaderboard"><LeaderboardTable rows={leaderboard} highlightTeamId={team?.team.id} /></Card>
    </div>
  );
}
