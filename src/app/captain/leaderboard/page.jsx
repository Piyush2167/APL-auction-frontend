"use client";
import { useLive } from "@/contexts/LiveContext";
import { Card, PageHeader } from "@/components/ui";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default function Page() {
  const { leaderboard, team } = useLive();
  return (
    <>
      <PageHeader title="Team leaderboard" description="Updates live after every sale and approved resale." />
      <Card><LeaderboardTable rows={leaderboard} highlightTeamId={team?.team.id} /></Card>
    </>
  );
}
