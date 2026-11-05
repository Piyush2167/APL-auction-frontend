"use client";
import { useLive } from "@/contexts/LiveContext";
import { Card } from "@/components/ui";
import BidPanel from "@/components/captain/BidPanel";
import { BidHistory } from "@/components/auction";

export default function Page() {
  const { state } = useLive();
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <BidPanel />
      <Card title={`Bid history (${state?.bidCount || 0})`} className="h-[32rem]" bodyClassName="min-h-0 flex-1 overflow-hidden p-0">
        <BidHistory bids={state?.bids} />
      </Card>
    </div>
  );
}
