"use client";
import { useState } from "react";
import { useResource, useAction } from "@/hooks/useResource";
import { useToast } from "@/contexts/ToastContext";
import { post, patch } from "@/services/api/client";
import { Button, Card, PageHeader, Skeleton, ErrorState, EmptyState, Badge, Table, Th, Td, ConfirmDialog, dateTime } from "@/components/ui";
import { TeamLogo } from "@/components/shared";

export default function CaptainsPage() {
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const { data, error, reload } = useResource("/admin/captains");
  const [confirm, setConfirm] = useState(null); // { kind, captain }

  const go = async () => {
    const { kind, captain: c } = confirm;
    const r = kind === "reset"
      ? await run("reset", () => post(`/admin/captains/${c.id}/reset-password`), (d) => (d.emailSent ? `New temporary password emailed to ${c.email}` : "Password reset, but the email failed. Check email settings."))
      : await run("toggle", () => patch(`/admin/captains/${c.id}`, { active: kind === "activate" }), kind === "activate" ? "Captain reactivated" : "Captain deactivated and signed out");
    if (r.ok) { setConfirm(null); reload(); }
  };
  const msg = confirm && {
    reset: { title: "Resend login details?", message: `${confirm.captain.name} gets a new temporary password by email and is signed out everywhere. The old password stops working.`, label: "Send new password", tone: "primary" },
    deactivate: { title: "Deactivate captain?", message: `${confirm.captain.name} is signed out immediately and cannot bid. You can then assign a new captain to ${confirm.captain.team?.name}.`, label: "Deactivate", tone: "danger" },
    activate: { title: "Reactivate captain?", message: `${confirm.captain.name} can sign in again.`, label: "Reactivate", tone: "primary" },
  }[confirm.kind];

  return (
    <>
      <PageHeader title="Captains" description="Captain accounts are created from the Teams page." />
      <Card>
        {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={5} /> : !data.length ? (
          <EmptyState title="No captains yet" description="Assign a captain to each team on the Teams page." />
        ) : (
          <Table>
            <thead><tr><Th>Captain</Th><Th>Team</Th><Th>Status</Th><Th>Last login</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <Td><span className="block min-w-40"><span className="block truncate font-medium">{c.name}</span><span className="block truncate text-xs text-muted">{c.email}</span></span></Td>
                  <Td>{c.team ? <span className="flex items-center gap-2"><TeamLogo team={c.team} size={24} /><span className="truncate">{c.team.name}</span></span> : <span className="text-muted">Unassigned</span>}</Td>
                  <Td>
                    {!c.active ? <Badge tone="danger">Inactive</Badge> : c.mustChangePassword
                      ? <Badge tone={c.tempPasswordExpiresAt && new Date(c.tempPasswordExpiresAt) < new Date() ? "danger" : "warning"}>{c.tempPasswordExpiresAt && new Date(c.tempPasswordExpiresAt) < new Date() ? "Invite expired" : "Invite pending"}</Badge>
                      : <Badge tone="success">Active</Badge>}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(c.lastLoginAt)}</Td>
                  <Td>
                    <span className="flex justify-end gap-2">
                      {c.active && <Button size="sm" onClick={() => setConfirm({ kind: "reset", captain: c })}>Resend login</Button>}
                      {c.active ? <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm({ kind: "deactivate", captain: c })}>Deactivate</Button>
                        : c.team && <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "activate", captain: c })}>Reactivate</Button>}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <ConfirmDialog open={!!confirm} title={msg?.title} message={msg?.message} confirmLabel={msg?.label} tone={msg?.tone} pending={!!pending} onClose={() => setConfirm(null)} onConfirm={go} />
    </>
  );
}
