"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, UserPlus, Eye } from "lucide-react";
import { useResource } from "@/hooks/useResource";
import { useToast } from "@/contexts/ToastContext";
import { post, patch, apiError } from "@/services/api/client";
import { Button, Card, PageHeader, Field, Input, Modal, Skeleton, ErrorState, EmptyState, Badge, StatusBadge, Table, Th, Td, points, dateTime } from "@/components/ui";
import { TeamLogo, PlayerImage } from "@/components/shared";
import { uploadImage } from "@/components/players/PlayerForm";

const teamSchema = z.object({
  name: z.string().trim().min(2, "Enter a team name").max(60),
  abbreviation: z.string().trim().min(2, "2–6 characters").max(6, "2–6 characters").regex(/^[A-Za-z0-9]+$/, "Letters and digits only"),
  logo: z.union([z.literal(""), z.url("Enter a full https:// URL")]),
  initialPurse: z.coerce.number().int().min(1, "Must be at least 1"),
  maxSquadSize: z.coerce.number().int().min(1, "Must be at least 1").max(50),
});
const captainSchema = z.object({ name: z.string().trim().min(2, "Enter the captain's name").max(100), email: z.email("Enter a valid email") });

function TeamForm({ team, config, locked, onClose, onSaved }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(teamSchema),
    values: { name: team?.name || "", abbreviation: team?.abbreviation || "", logo: team?.logo || "", initialPurse: team?.initialPurse ?? config?.teamPurse ?? 500, maxSquadSize: team?.maxSquadSize ?? config?.maxSquadSize ?? 7 },
  });
  const submit = async (d) => {
    const body = { name: d.name, abbreviation: d.abbreviation.toUpperCase(), logo: d.logo || null, ...(locked ? {} : { initialPurse: d.initialPurse, maxSquadSize: d.maxSquadSize }) };
    try {
      await (team?.id ? patch(`/admin/teams/${team.id}`, body) : post("/admin/teams", body));
      toast.success(team?.id ? "Team updated" : "Team created");
      onSaved(); onClose();
    } catch (e) {
      const err = apiError(e);
      if (err.code === "DUPLICATE") setError("name", { message: "A team with this name or abbreviation already exists" });
      else toast.error(err.message);
    }
  };
  return (
    <Modal open onClose={onClose} title={team?.id ? `Edit ${team.name}` : "Create team"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" pending={isSubmitting} onClick={handleSubmit(submit)}>{team?.id ? "Save changes" : "Create team"}</Button></>}>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><Field label="Team name" error={errors.name?.message}>{(a) => <Input {...a} {...register("name")} />}</Field></div>
        <Field label="Abbreviation" error={errors.abbreviation?.message}>{(a) => <Input {...a} className="uppercase" {...register("abbreviation")} />}</Field>
        <Field label="Initial purse (points)" hint={locked ? "Locked after the auction starts" : undefined} error={errors.initialPurse?.message}>{(a) => <Input {...a} type="number" inputMode="numeric" disabled={locked} {...register("initialPurse")} />}</Field>
        <Field label="Max squad size" hint={locked ? "Locked after the auction starts" : undefined} error={errors.maxSquadSize?.message}>{(a) => <Input {...a} type="number" inputMode="numeric" disabled={locked} {...register("maxSquadSize")} />}</Field>
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Field label="Logo URL" error={errors.logo?.message}>{(a) => <Input {...a} type="url" placeholder="https://" {...register("logo")} />}</Field>
          <label className="inline-flex w-fit cursor-pointer text-sm text-accent hover:underline">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading}
              onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); try { setValue("logo", await uploadImage(f)); } catch (err) { toast.error(apiError(err).message); } finally { setUploading(false); } }} />
            {uploading ? "Uploading…" : "Or upload a logo"}
          </label>
        </div>
      </form>
    </Modal>
  );
}

function CaptainForm({ team, onClose, onSaved }) {
  const toast = useToast();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(captainSchema) });
  const submit = async (d) => {
    try {
      const r = await post(`/admin/teams/${team.id}/captain`, d);
      if (r.emailSent) toast.success(`Captain created. Login details emailed to ${d.email}.`);
      else toast.error("Captain created, but the email could not be sent. Use “Resend login” on the Captains page.");
      onSaved(); onClose();
    } catch (e) {
      const err = apiError(e);
      if (err.code === "EMAIL_IN_USE") setError("email", { message: err.message }); else toast.error(err.message);
    }
  };
  return (
    <Modal open onClose={onClose} title={`Assign captain · ${team.name}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" pending={isSubmitting} onClick={handleSubmit(submit)}>Create captain and send email</Button></>}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-muted">A secure temporary password is emailed to the captain. They must set their own password at first login.</p>
        <Field label="Captain name" error={errors.name?.message}>{(a) => <Input {...a} autoComplete="off" {...register("name")} />}</Field>
        <Field label="Captain email" error={errors.email?.message}>{(a) => <Input {...a} type="email" autoComplete="off" {...register("email")} />}</Field>
      </form>
    </Modal>
  );
}

function TeamDetail({ id, onClose }) {
  const { data, error, reload } = useResource(`/admin/teams/${id}`);
  return (
    <Modal open onClose={onClose} size="lg" title={data ? data.name : "Team"} footer={<Button onClick={onClose}>Close</Button>}>
      {error ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={5} /> : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[["Initial", data.initialPurse], ["Spent", data.totalSpent], ["Resale credits", data.totalResaleCredits], ["Remaining", data.remainingPurse]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">{l}</p><p className="font-semibold tabular-nums">{points(v)}</p></div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Squad ({data.playersPurchased}/{data.maxSquadSize})</h3>
            {!data.squad.length ? <p className="text-sm text-muted">No players yet.</p> : (
              <ul className="flex flex-col">{data.squad.map((p) => (
                <li key={p.id} className="flex min-w-0 items-center gap-3 border-b border-line/60 py-2 text-sm">
                  <PlayerImage player={p} size={32} /><span className="min-w-0 flex-1 truncate">{p.name}{p.playerType === "MYSTERY" && <Badge tone="mystery" className="ml-2">Mystery</Badge>}</span>
                  <StatusBadge status={p.status} /><span className="w-20 text-right tabular-nums">{points(p.purchasePrice)}</span>
                </li>))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Ledger</h3>
            {!data.ledger.length ? <p className="text-sm text-muted">No ledger entries yet. The initial purse is recorded when the auction starts.</p> : (
              <Table><thead><tr><Th>When</Th><Th>Type</Th><Th>Player</Th><Th num>Debit</Th><Th num>Credit</Th></tr></thead><tbody>
                {data.ledger.map((l) => <tr key={l._id}><Td className="whitespace-nowrap text-xs text-muted">{dateTime(l.createdAt)}</Td><Td className="text-xs">{l.type.replace(/_/g, " ")}</Td><Td className="max-w-32 truncate">{l.player?.name || "—"}</Td><Td num>{l.debit || ""}</Td><Td num>{l.credit || ""}</Td></tr>)}
              </tbody></Table>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function TeamsPage() {
  const { data, error, reload } = useResource("/admin/teams");
  const season = useResource("/admin/season");
  const [form, setForm] = useState(null);
  const [captainFor, setCaptainFor] = useState(null);
  const [detail, setDetail] = useState(null);
  const cfg = season.data?.config;
  const started = season.data && !["CREATED", "READY"].includes(season.data.auctionStatus);
  const full = cfg && data && data.length >= cfg.teamCount;

  return (
    <>
      <PageHeader title="Teams" description={cfg ? `${data?.length ?? "…"} of ${cfg.teamCount} configured teams` : undefined}
        actions={<Button variant="primary" disabled={!cfg || started || full} title={started ? "Teams cannot be added after the auction starts" : full ? "Team limit reached (change it in Settings)" : undefined} onClick={() => setForm({})}><Plus className="size-4" aria-hidden />Create team</Button>} />
      <Card>
        {error?.code === "NO_SEASON" ? <EmptyState title="Create the auction first" description="Teams belong to an auction. Create it in Settings." />
          : error && !data ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton rows={5} /> : !data.length ? (
            <EmptyState title="No teams yet" description="Create each team, then assign its captain." action={<Button size="sm" variant="primary" disabled={!cfg} onClick={() => setForm({})}>Create team</Button>} />
          ) : (
            <Table>
              <thead><tr><Th>Team</Th><Th>Captain</Th><Th num>Purse</Th><Th num>Remaining</Th><Th num>Squad</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id}>
                    <Td><span className="flex min-w-40 items-center gap-2"><TeamLogo team={t} size={32} /><span className="min-w-0"><span className="block truncate font-medium">{t.name}</span><span className="text-xs text-muted">{t.abbreviation}</span></span></span></Td>
                    <Td>{t.captain ? (
                      <span className="block min-w-0"><span className="block truncate">{t.captain.name}</span><span className="flex flex-wrap gap-1 text-xs text-muted"><span className="truncate">{t.captain.email}</span>{!t.captain.active && <Badge tone="danger">Inactive</Badge>}{t.captain.active && t.captain.mustChangePassword && <Badge tone="warning">Invite pending</Badge>}</span></span>
                    ) : <Badge tone="warning">No captain</Badge>}</Td>
                    <Td num>{t.initialPurse}</Td>
                    <Td num>{t.remainingPurse}</Td>
                    <Td num>{t.playersPurchased}/{t.maxSquadSize}</Td>
                    <Td>
                      <span className="flex justify-end gap-1">
                        {(!t.captain || !t.captain.active) && <Button size="sm" onClick={() => setCaptainFor(t)}><UserPlus className="size-4" aria-hidden />Assign captain</Button>}
                        <Button size="sm" variant="ghost" aria-label={`View ${t.name}`} onClick={() => setDetail(t.id)}><Eye className="size-4" /></Button>
                        <Button size="sm" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => setForm(t)}><Pencil className="size-4" /></Button>
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
      </Card>
      {form && <TeamForm team={form} config={cfg} locked={started} onClose={() => setForm(null)} onSaved={reload} />}
      {captainFor && <CaptainForm team={captainFor} onClose={() => setCaptainFor(null)} onSaved={reload} />}
      {detail && <TeamDetail id={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
