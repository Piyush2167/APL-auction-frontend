"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useResource } from "@/hooks/useResource";
import { Card, PageHeader, Skeleton, ErrorState, EmptyState, Table, Th, Td, Pagination, Badge, StatusBadge, cx, dateTime, points } from "@/components/ui";

const TABS = [
  { id: "activity", label: "Activity log", url: "/admin/logs" },
  { id: "transactions", label: "Auction transactions", url: "/admin/transactions" },
  { id: "ledger", label: "Financial ledger", url: "/admin/ledger" },
  { id: "bids", label: "All bids", url: "/admin/auction/bids" },
  { id: "reconcile", label: "Reconciliation", url: "/admin/ledger/reconcile" },
  { id: "mystery", label: "Mystery tokens", url: "/admin/mystery-tokens" },
];
const human = (t) => String(t).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function Rows({ tab, data }) {
  const rows = Array.isArray(data) ? data : data.rows;
  if (!rows.length) return <EmptyState title="Nothing recorded yet" />;
  if (tab === "activity") return (
    <Table><thead><tr><Th>When</Th><Th>Event</Th><Th>By</Th><Th>Details</Th></tr></thead><tbody>
      {rows.map((l) => <tr key={l.id}><Td className="whitespace-nowrap text-xs text-muted">{dateTime(l.at)}</Td><Td className="whitespace-nowrap">{human(l.type)}</Td><Td className="whitespace-nowrap">{l.actor.name} <span className="text-xs text-muted">{l.actor.role}</span></Td>
        <Td className="max-w-md truncate font-mono text-xs text-muted" title={JSON.stringify(l.details)}>{l.details ? JSON.stringify(l.details) : l.newState && typeof l.newState === "string" ? `${l.previousState} → ${l.newState}` : "—"}</Td></tr>)}
    </tbody></Table>
  );
  if (tab === "transactions") return (
    <Table><thead><tr><Th>When</Th><Th>Type</Th><Th>Player</Th><Th>Team</Th><Th num>Amount</Th></tr></thead><tbody>
      {rows.map((t) => <tr key={t.id}><Td className="whitespace-nowrap text-xs text-muted">{dateTime(t.at)}</Td><Td><Badge>{t.type}</Badge></Td><Td>{t.player?.name}</Td><Td>{t.team?.name || "—"}</Td><Td num>{t.amount ? points(t.amount) : "—"}</Td></tr>)}
    </tbody></Table>
  );
  if (tab === "ledger") return (
    <Table><thead><tr><Th>When</Th><Th>Team</Th><Th>Type</Th><Th>Player</Th><Th num>Debit</Th><Th num>Credit</Th></tr></thead><tbody>
      {rows.map((l) => <tr key={l._id}><Td className="whitespace-nowrap text-xs text-muted">{dateTime(l.createdAt)}</Td><Td>{l.team?.name}</Td><Td className="text-xs">{human(l.type)}</Td><Td>{l.player?.name || "—"}</Td><Td num>{l.debit || ""}</Td><Td num>{l.credit || ""}</Td></tr>)}
    </tbody></Table>
  );
  if (tab === "bids") return (
    <Table><thead><tr><Th num>Seq</Th><Th>When</Th><Th>Player</Th><Th>Team</Th><Th num>Amount</Th></tr></thead><tbody>
      {rows.map((b) => <tr key={b.id}><Td num>{b.seq}</Td><Td className="whitespace-nowrap text-xs text-muted">{dateTime(b.at)}</Td><Td>{b.player?.name}</Td><Td>{b.team?.name}</Td><Td num>{points(b.amount)}</Td></tr>)}
    </tbody></Table>
  );
  if (tab === "reconcile") return (
    <Table><thead><tr><Th>Team</Th><Th num>Cached remaining</Th><Th num>Ledger remaining</Th><Th num>Ledger spent</Th><Th num>Resale credits</Th><Th>Result</Th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.teamId}><Td>{r.name}</Td><Td num>{r.cachedRemaining}</Td><Td num>{r.ledgerRemaining}</Td><Td num>{r.ledgerSpent}</Td><Td num>{r.ledgerResaleCredits}</Td><Td>{r.ok ? <Badge tone="success">Balanced</Badge> : <Badge tone="danger">Mismatch</Badge>}</Td></tr>)}
    </tbody></Table>
  );
  return (
    <Table><thead><tr><Th>Team</Th><Th>Token</Th><Th>Used</Th><Th>By</Th><Th>Revealed player</Th></tr></thead><tbody>
      {rows.map((t) => <tr key={t.team.id}><Td>{t.team.name}</Td><Td><StatusBadge status={t.status === "USED" ? "SOLD" : "AVAILABLE"} /></Td><Td className="text-xs text-muted">{dateTime(t.usedAt)}</Td><Td>{t.usedBy || "—"}</Td><Td>{t.revealedPlayer?.name || "—"}</Td></tr>)}
    </tbody></Table>
  );
}

export default function LogsView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = TABS.find((t) => t.id === sp.get("tab")) || TABS[0];
  const page = Number(sp.get("page")) || 1;
  const go = (p) => router.replace(`${pathname}?${new URLSearchParams(p)}`, { scroll: false });

  return (
    <>
      <PageHeader title="History & logs" description="Append-only records of every auction, financial and administrative action." />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab.id} onClick={() => go({ tab: t.id })}
            className={cx("whitespace-nowrap border-b-2 px-3 py-2 text-sm", t.id === tab.id ? "border-primary text-accent" : "border-transparent text-muted hover:text-fg")}>{t.label}</button>
        ))}
      </div>
      <TabContent key={tab.id} tab={tab} page={page} onPage={(p) => go({ tab: tab.id, page: p })} />
    </>
  );
}

/** Keyed by tab, so switching tabs never renders one tab's data with another tab's table. */
function TabContent({ tab, page, onPage }) {
  const paged = !["reconcile", "mystery"].includes(tab.id);
  const { data, error, loading, reload } = useResource(tab.url, paged ? { page, limit: 50 } : undefined);
  return (
    <Card>
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={6} /> : (
        <div className={loading ? "opacity-60" : undefined}>
          <Rows tab={tab.id} data={data} />
          {paged && data.total != null && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={onPage} />}
        </div>
      )}
    </Card>
  );
}
