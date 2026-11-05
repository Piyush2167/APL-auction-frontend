"use client";
import Link from "next/link";
import { useLive } from "@/contexts/LiveContext";
import { Card, PageHeader, Skeleton, EmptyState, StatusBadge, Table, Th, Td, points, dateTime } from "@/components/ui";
import { PlayerImage } from "@/components/shared";

export default function Page() {
  const { team } = useLive();
  const rows = team?.resaleRequests;
  return (
    <>
      <PageHeader title="Resale requests" description="Requests are reviewed by the administrator. Refunds are credited only on approval." />
      <Card>
        {!rows ? <Skeleton rows={3} /> : !rows.length ? (
          <EmptyState title="No resale requests" description="You can request resale of your highest-priced player from your squad." action={<Link href="/captain/team" className="text-sm text-accent underline">Open my squad</Link>} />
        ) : (
          <Table>
            <thead><tr><Th>Player</Th><Th num>Refund</Th><Th>Requested</Th><Th>Status</Th><Th>Reason</Th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td><span className="flex min-w-40 items-center gap-2"><PlayerImage player={r.player} size={28} /><span className="truncate">{r.player?.name}</span></span></Td>
                  <Td num>{points(r.originalPurchaseAmount)}</Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(r.createdAt)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="max-w-60 truncate text-muted">{r.reason || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
