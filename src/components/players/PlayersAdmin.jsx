"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { useResource, useAction } from "@/hooks/useResource";
import { useToast } from "@/contexts/ToastContext";
import { del } from "@/services/api/client";
import { Button, Card, PageHeader, Input, Select, Skeleton, ErrorState, EmptyState, StatusBadge, Badge, Table, Th, Td, Pagination, ConfirmDialog, points } from "@/components/ui";
import { PlayerImage } from "@/components/shared";
import PlayerForm from "./PlayerForm";
import ImportDialog from "./ImportDialog";

const STATUSES = ["AVAILABLE", "ACTIVE", "FINALIZING", "SOLD", "UNSOLD", "SKIPPED", "RESALE_PENDING", "RESALE_APPROVED", "RESOLD"];

export default function PlayersAdmin() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const params = Object.fromEntries(["q", "status", "category", "playerType", "page"].map((k) => [k, sp.get(k)]).filter(([, v]) => v));
  const { data, error, loading, reload } = useResource("/admin/players", { limit: 50, ...params });
  const season = useResource("/admin/season");
  const config = season.data?.config;
  const [editing, setEditing] = useState(null); // null | {} (new) | player
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [q, setQ] = useState(params.q || "");

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    if (k !== "page") n.delete("page");
    router.replace(`${pathname}?${n}`, { scroll: false });
  };
  const filtered = Object.keys(params).some((k) => k !== "page");

  if (season.error?.code === "NO_SEASON" || (season.data === null && !season.loading)) {
    return <Card><EmptyState title="Create the auction first" description="Players belong to an auction. Create it in Settings." /></Card>;
  }

  return (
    <>
      <PageHeader title="Players" description={data ? `${data.total} player${data.total === 1 ? "" : "s"}${filtered ? " match these filters" : " registered"}` : "Manage the registered player pool."}
        actions={<>
          <Button onClick={() => setImporting(true)}><Upload className="size-4" aria-hidden />Import CSV/JSON</Button>
          <Button variant="primary" disabled={!config} onClick={() => setEditing({})}><Plus className="size-4" aria-hidden />Add player</Button>
        </>} />
      <Card>
        <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]" onSubmit={(e) => { e.preventDefault(); setParam("q", q.trim()); }} role="search">
          <Input type="search" placeholder="Search by name, press Enter" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search players" />
          <Select aria-label="Filter by status" value={params.status || ""} onChange={(e) => setParam("status", e.target.value)}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </Select>
          <Select aria-label="Filter by category" value={params.category || ""} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">All categories</option>{config?.categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select aria-label="Filter by type" value={params.playerType || ""} onChange={(e) => setParam("playerType", e.target.value)}>
            <option value="">All types</option><option value="NORMAL">Normal</option><option value="MYSTERY">Mystery</option>
          </Select>
        </form>
        {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={6} /> : !data.rows.length ? (
          filtered ? <EmptyState title="No players match" description="Try different filters." action={<Button size="sm" onClick={() => { setQ(""); router.replace(pathname); }}>Clear filters</Button>} />
            : <EmptyState title="No players yet" description="Add players one by one or import a CSV/JSON file." action={<Button size="sm" variant="primary" onClick={() => setImporting(true)}>Import players</Button>} />
        ) : (
          <div className={loading ? "opacity-60" : undefined}>
            <Table>
              <thead><tr><Th num>#</Th><Th>Player</Th><Th>Category</Th><Th>Type</Th><Th num>Base</Th><Th>Status</Th><Th>Team</Th><Th num>Price</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
              <tbody>
                {data.rows.map((p) => (
                  <tr key={p.id}>
                    <Td num className="text-muted">{p.auctionOrder}</Td>
                    <Td><span className="flex min-w-48 items-center gap-2"><PlayerImage player={p} size={32} /><span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="block truncate text-xs text-muted">{p.gender}{p.registrationId ? ` · ${p.registrationId}` : ""}</span></span></span></Td>
                    <Td>{p.category}</Td>
                    <Td>{p.playerType === "MYSTERY" ? <Badge tone="mystery">Mystery</Badge> : <span className="text-muted">Normal</span>}</Td>
                    <Td num>{p.basePrice}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="max-w-32 truncate">{p.currentTeam?.name || "—"}</Td>
                    <Td num>{p.purchasePrice != null ? points(p.purchasePrice) : "—"}</Td>
                    <Td>
                      <span className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil className="size-4" /></Button>
                        {p.status === "AVAILABLE" && <Button size="sm" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 className="size-4 text-danger" /></Button>}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPage={(n) => setParam("page", String(n))} />
          </div>
        )}
      </Card>
      {config && <PlayerForm open={!!editing} player={editing?.id ? editing : null} categories={config.categories} defaultBasePrice={config.defaultBasePrice} sport={season.data?.season?.sport} onClose={() => setEditing(null)} onSaved={reload} />}
      <ImportDialog open={importing} onClose={() => setImporting(false)} onImported={reload} />
      <ConfirmDialog open={!!deleting} title={`Delete ${deleting?.name}?`} message="This permanently removes the player. Only players never put up for auction can be deleted." confirmLabel="Delete player" tone="danger"
        pending={pending === "delete"} onClose={() => setDeleting(null)}
        onConfirm={async () => { const r = await run("delete", () => del(`/admin/players/${deleting.id}`), "Player deleted"); if (r.ok) { setDeleting(null); reload(); } }} />
    </>
  );
}
