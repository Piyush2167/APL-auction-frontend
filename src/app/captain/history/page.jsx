"use client";
import { useState } from "react";
import { useLive } from "@/contexts/LiveContext";
import { useResource } from "@/hooks/useResource";
import { Card, PageHeader, Skeleton, ErrorState, EmptyState, Table, Th, Td, Pagination, StatusBadge, points, dateTime } from "@/components/ui";
import { PlayerImage } from "@/components/shared";

export default function Page() {
  const { team } = useLive();
  const [page, setPage] = useState(1);
  const { data, error, reload } = useResource("/captain/auction/history", { page, limit: 50 });
  const purchases = team?.squad;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" description="Your purchases and every bid your team has placed." />
      <Card title="Purchases">
        {!purchases ? <Skeleton rows={3} /> : !purchases.length ? <p className="text-sm text-muted">No purchases yet.</p> : (
          <Table><thead><tr><Th>Player</Th><Th>Category</Th><Th>Status</Th><Th num>Price</Th></tr></thead><tbody>
            {purchases.map((p) => <tr key={p.id}><Td><span className="flex items-center gap-2"><PlayerImage player={p} size={28} /><span className="truncate">{p.name}</span></span></Td><Td>{p.category}</Td><Td><StatusBadge status={p.status} /></Td><Td num>{points(p.purchasePrice)}</Td></tr>)}
          </tbody></Table>
        )}
      </Card>
      <Card title="Bids placed" actions={<button type="button" onClick={reload} className="text-sm text-accent hover:underline">Refresh</button>}>
        {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={4} /> : !data.rows.length ? <EmptyState title="No bids yet" /> : (
          <>
            <Table><thead><tr><Th>When</Th><Th>Player</Th><Th num>Amount</Th></tr></thead><tbody>
              {data.rows.map((b) => <tr key={b.id}><Td className="whitespace-nowrap text-xs text-muted">{dateTime(b.at)}</Td><Td>{b.player?.name}</Td><Td num>{points(b.amount)}</Td></tr>)}
            </tbody></Table>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
