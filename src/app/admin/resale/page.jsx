"use client";
import { useState } from "react";
import { useLive } from "@/contexts/LiveContext";
import { useToast } from "@/contexts/ToastContext";
import { useAction, useResource } from "@/hooks/useResource";
import { post } from "@/services/api/client";
import { Card, PageHeader, Skeleton, ErrorState, EmptyState, StatusBadge, Button, Modal, Field, Textarea, ConfirmDialog, Table, Th, Td, points, dateTime } from "@/components/ui";
import { PlayerImage, TeamLogo } from "@/components/shared";

export default function ResalePage() {
  const { state, leaderboard, lastEvent } = useLive();
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const { data, error, reload } = useResource("/admin/resale", undefined, `${state?.version}:${lastEvent?.at}:${leaderboard?.length}`);
  const [approve, setApprove] = useState(null);
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState("");

  const doApprove = async () => {
    const r = await run("approve", () => post(`/admin/resale/${approve.id}/approve`), `Approved: ${points(approve.originalPurchaseAmount)} credited to ${approve.team.name}`);
    if (r.ok) { setApprove(null); reload(); }
  };
  const doReject = async () => {
    const r = await run("reject", () => post(`/admin/resale/${reject.id}/reject`, { reason }), "Request rejected");
    if (r.ok) { setReject(null); setReason(""); reload(); }
  };

  return (
    <>
      <PageHeader title="Resale requests" description="Approving refunds the original purchase price and returns the player to the pool at their original base price." />
      <Card>
        {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={4} /> : !data.length ? (
          <EmptyState title="No resale requests" description="Captains can request resale of their highest-priced player from their squad page." />
        ) : (
          <Table>
            <thead><tr><Th>Player</Th><Th>Team</Th><Th num>Refund</Th><Th>Requested</Th><Th>Status</Th><Th>Note</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <Td><span className="flex min-w-40 items-center gap-2"><PlayerImage player={r.player} size={32} /><span className="truncate">{r.player?.name}</span></span></Td>
                  <Td><span className="flex items-center gap-2"><TeamLogo team={r.team} size={24} /><span className="truncate">{r.team?.name}</span></span></Td>
                  <Td num>{points(r.originalPurchaseAmount)}</Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(r.createdAt)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="max-w-48 truncate text-muted">{r.reason || (r.processedBy ? `by ${r.processedBy}` : "—")}</Td>
                  <Td>
                    {r.status === "PENDING" && (
                      <span className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setReject(r)}>Reject</Button>
                        <Button size="sm" variant="primary" onClick={() => setApprove(r)}>Approve</Button>
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <ConfirmDialog open={!!approve} title="Approve resale?" pending={pending === "approve"} confirmLabel="Approve and refund" onClose={() => setApprove(null)} onConfirm={doApprove}
        message={approve && `${approve.player?.name} leaves ${approve.team?.name}. ${points(approve.originalPurchaseAmount)} is credited to their purse and the player returns to the pool at base price ${points(approve.player?.originalBasePrice)}.`} />
      <Modal open={!!reject} onClose={() => setReject(null)} title="Reject resale request"
        footer={<><Button onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" pending={pending === "reject"} disabled={reason.trim().length < 3} onClick={doReject}>Reject request</Button></>}>
        <Field label="Reason (shown to the captain)" hint="At least 3 characters">{(a) => <Textarea {...a} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />}</Field>
      </Modal>
    </>
  );
}
