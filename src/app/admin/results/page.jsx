"use client";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { useResource } from "@/hooks/useResource";
import { useToast } from "@/contexts/ToastContext";
import { api, apiError } from "@/services/api/client";
import { Button, Card, PageHeader, Skeleton, ErrorState, EmptyState, Badge, Table, Th, Td, points } from "@/components/ui";
import { TeamLogo } from "@/components/shared";

export default function ResultsPage() {
  const toast = useToast();
  const { data, error, reload } = useResource("/admin/results");
  const [downloading, setDownloading] = useState(false);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await api.get("/admin/results.csv", { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = Object.assign(document.createElement("a"), { href: url, download: "apl-auction-results.csv" });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(apiError(e).message); } finally { setDownloading(false); }
  };

  return (
    <div className="print-area">
      <PageHeader title="Auction results" description="Final squads and finances for every team."
        actions={<div className="no-print flex gap-2">
          <Button onClick={() => window.print()}><Printer className="size-4" aria-hidden />Print / save PDF</Button>
          <Button variant="primary" pending={downloading} onClick={downloadCsv}><Download className="size-4" aria-hidden />Download CSV</Button>
        </div>} />
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={6} /> : !data.length ? <Card><EmptyState title="No teams yet" /></Card> : (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.map((t) => (
            <Card key={t.id} className="break-inside-avoid" title={<span className="flex items-center gap-2"><TeamLogo team={t} size={24} />{t.name}</span>}
              actions={<span className="text-xs text-muted">Captain: {t.captainName || "—"}</span>}>
              <dl className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted">Spent</dt><dd className="tabular-nums">{points(t.totalSpent)}</dd></div>
                <div><dt className="text-xs text-muted">Resale credits</dt><dd className="tabular-nums">{points(t.totalResaleCredits)}</dd></div>
                <div><dt className="text-xs text-muted">Remaining</dt><dd className="font-semibold tabular-nums">{points(t.remainingPurse)}</dd></div>
                <div><dt className="text-xs text-muted">Squad</dt><dd className="tabular-nums">{t.playersPurchased}/{t.maxSquadSize} ({t.squadCompletion}%)</dd></div>
              </dl>
              {!t.squad.length ? <p className="text-sm text-muted">No players purchased.</p> : (
                <Table><thead><tr><Th>Player</Th><Th>Category</Th><Th num>Price</Th></tr></thead><tbody>
                  {t.squad.map((p) => <tr key={p.id}><Td>{p.name}{p.playerType === "MYSTERY" && <Badge tone="mystery" className="ml-2">Mystery</Badge>}</Td><Td>{p.category}</Td><Td num>{p.purchasePrice}</Td></tr>)}
                </tbody></Table>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
