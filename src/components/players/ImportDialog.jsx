"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button, Modal, Table, Th, Td, Badge } from "@/components/ui";
import { post, apiError } from "@/services/api/client";

const send = (url, file) => { const fd = new FormData(); fd.append("file", file); return post(url, fd); };
const fmtOf = (f) => (f?.name.toLowerCase().endsWith(".json") ? "json" : f?.name.toLowerCase().endsWith(".csv") ? "csv" : null);

/** Steps: choose file -> server preview -> confirm -> summary. The server re-validates on confirm. */
export default function ImportDialog({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const reset = () => { setFile(null); setPreview(null); setSummary(null); setError(null); };
  const close = () => { reset(); onClose(); };

  const doPreview = async () => {
    if (!fmtOf(file)) return setError("Choose a .csv or .json file.");
    setBusy(true); setError(null);
    try { setPreview(await send("/admin/players/import/preview", file)); } catch (e) { setError(apiError(e).message); } finally { setBusy(false); }
  };
  const doImport = async () => {
    setBusy(true); setError(null);
    try { const s = await send(`/admin/players/import/${fmtOf(file)}`, file); setSummary(s); onImported?.(); } catch (e) { setError(apiError(e).message); } finally { setBusy(false); }
  };

  const footer = summary ? <Button variant="primary" onClick={close}>Done</Button>
    : preview ? <><Button onClick={reset} disabled={busy}>Choose another file</Button><Button variant="primary" pending={busy} disabled={!preview.validCount} onClick={doImport}>Import {preview.validCount} valid player{preview.validCount === 1 ? "" : "s"}</Button></>
      : <><Button onClick={close}>Cancel</Button><Button variant="primary" pending={busy} disabled={!file} onClick={doPreview}>Preview import</Button></>;

  const problems = (p) => [
    ...p.invalid.map((r) => ({ row: r.row, kind: "Invalid", text: r.errors.join("; ") })),
    ...p.duplicates.map((r) => ({ row: r.row, kind: "Duplicate", text: `${r.name}: ${r.reason}` })),
  ].sort((a, b) => a.row - b.row);

  return (
    <Modal open={open} onClose={close} title="Import players" size="lg" footer={footer}>
      {error && <p role="alert" className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {summary ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm"><b className="text-success">{summary.imported}</b> imported, <b className="text-danger">{summary.failed}</b> not imported, out of {summary.total} rows.</p>
          {summary.failed > 0 && <ProblemTable rows={problems(summary)} />}
        </div>
      ) : preview ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{preview.validCount} valid</Badge>
            <Badge tone="danger">{preview.invalidCount} invalid</Badge>
            <Badge tone="warning">{preview.duplicateCount} duplicate</Badge>
            <Badge>{preview.total} rows</Badge>
          </div>
          {preview.validCount > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Will be imported</h3>
              <div className="max-h-56 overflow-y-auto">
                <Table><thead><tr><Th num>Row</Th><Th>Name</Th><Th>Category</Th><Th>Type</Th><Th num>Base</Th></tr></thead><tbody>
                  {preview.valid.map((v) => <tr key={v.row}><Td num>{v.row}</Td><Td>{v.data.name}</Td><Td>{v.data.category}</Td><Td>{v.data.playerType}</Td><Td num>{v.data.basePrice}</Td></tr>)}
                </tbody></Table>
              </div>
            </div>
          )}
          {(preview.invalidCount + preview.duplicateCount) > 0 && <div><h3 className="mb-2 text-sm font-medium">Will NOT be imported</h3><ProblemTable rows={problems(preview)} /></div>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Upload a CSV or JSON file. Required: name, gender, category. Optional: image, battingStyle, bowlingStyle, skills (separated by ;), publicSkills, experience, registrationId, basePrice, playerType (NORMAL or MYSTERY). Existing players are never overwritten.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/templates/players-template.csv" download className="inline-flex items-center gap-1 text-accent hover:underline"><Download className="size-4" aria-hidden />CSV template</a>
            <a href="/templates/players-template.json" download className="inline-flex items-center gap-1 text-accent hover:underline"><Download className="size-4" aria-hidden />JSON template</a>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            File
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); }}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-fg" />
          </label>
        </div>
      )}
    </Modal>
  );
}

function ProblemTable({ rows }) {
  return (
    <div className="max-h-56 overflow-y-auto">
      <Table><thead><tr><Th num>Row</Th><Th>Problem</Th><Th>Details</Th></tr></thead><tbody>
        {rows.map((r, i) => <tr key={i}><Td num>{r.row}</Td><Td><Badge tone={r.kind === "Invalid" ? "danger" : "warning"}>{r.kind}</Badge></Td><Td className="text-xs">{r.text}</Td></tr>)}
      </tbody></Table>
    </div>
  );
}
