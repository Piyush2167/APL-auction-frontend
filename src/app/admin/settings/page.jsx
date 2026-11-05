"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Play } from "lucide-react";
import { useResource, useAction } from "@/hooks/useResource";
import { useToast } from "@/contexts/ToastContext";
import { post, patch, apiError } from "@/services/api/client";
import { Button, Card, PageHeader, Field, Input, Select, Textarea, Skeleton, ErrorState, StatusBadge, ConfirmDialog } from "@/components/ui";

const int = (min, max) => z.coerce.number().int("Whole numbers only").min(min, `At least ${min}`).max(max, `At most ${max}`);
const configSchema = z.object({
  teamCount: int(2, 32), teamPurse: int(1, 10000000), maxSquadSize: int(1, 50), defaultBasePrice: int(0, 1000000),
  bidIncrements: z.string().regex(/^\s*[1-9]\d*(\s*,\s*[1-9]\d*){0,3}\s*$/, "Whole numbers, comma separated, e.g. 3, 5"), finalizationSeconds: int(0, 30),
  publicBudgetVisible: z.enum(["true", "false"]), resaleEnabled: z.enum(["true", "false"]), mysteryEnabled: z.enum(["true", "false"]),
  categories: z.string().min(2, "At least one category"),
  reason: z.string().max(300).optional(),
});
const seasonSchema = configSchema.extend({ name: z.string().trim().min(2, "Enter the auction name").max(60), year: int(2000, 2100), sport: z.enum(["CRICKET", "FOOTBALL"]) });
const SPORT_CATEGORIES = {
  CRICKET: "Batsman, Bowler, All-rounder, Wicketkeeper, Fielder",
  FOOTBALL: "Goalkeeper, Defender, Midfielder, Forward",
};
const SPORT_LABEL = { CRICKET: "Cricket", FOOTBALL: "Football" };
const FIN = ["teamCount", "teamPurse", "maxSquadSize", "defaultBasePrice", "categories"];
const toBody = (d) => ({
  teamCount: d.teamCount, teamPurse: d.teamPurse, maxSquadSize: d.maxSquadSize, defaultBasePrice: d.defaultBasePrice,
  bidIncrements: d.bidIncrements.split(",").map((n) => Number(n.trim())).filter((n) => n > 0), finalizationSeconds: d.finalizationSeconds,
  publicBudgetVisible: d.publicBudgetVisible === "true", resaleEnabled: d.resaleEnabled === "true", mysteryEnabled: d.mysteryEnabled === "true",
  categories: d.categories.split(",").map((c) => c.trim()).filter(Boolean),
});
const DEFAULTS = { teamCount: 8, teamPurse: 500, maxSquadSize: 7, defaultBasePrice: 20, bidIncrements: "3, 5", finalizationSeconds: 0, publicBudgetVisible: "true", resaleEnabled: "true", mysteryEnabled: "true", categories: "Batsman, Bowler, All-rounder, Wicketkeeper, Fielder" };

function ConfigFields({ register, errors, started }) {
  const lock = (k) => started && FIN.includes(k);
  const num = (k, label, hint) => (
    <Field label={label} hint={lock(k) ? "Locked after the auction starts" : hint} error={errors[k]?.message}>{(a) => <Input {...a} type="number" inputMode="numeric" disabled={lock(k)} {...register(k)} />}</Field>
  );
  const yn = (k, label) => <Field label={label}>{(a) => <Select {...a} {...register(k)}><option value="true">Yes</option><option value="false">No</option></Select>}</Field>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {num("teamCount", "Number of teams")}
      {num("teamPurse", "Team purse (points)", "Default for new teams")}
      {num("maxSquadSize", "Maximum squad size", "Default for new teams")}
      {num("defaultBasePrice", "Default base price")}
      <Field label="Bid raises (points)" hint="Captains pick one of these on every bid, e.g. 3, 5" error={errors.bidIncrements?.message}>{(a) => <Input {...a} inputMode="numeric" {...register("bidIncrements")} />}</Field>
      {num("finalizationSeconds", "SOLD delay (seconds)", "0 = sold immediately on click. Otherwise a visual countdown; bidding stays locked")}
      {yn("publicBudgetVisible", "Show team budgets to audience")}
      {yn("resaleEnabled", "Resale enabled")}
      {yn("mysteryEnabled", "Mystery players enabled")}
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Player categories" hint={lock("categories") ? "Locked after the auction starts" : "Comma separated"} error={errors.categories?.message}>{(a) => <Input {...a} disabled={lock("categories")} {...register("categories")} />}</Field>
      </div>
    </div>
  );
}

function CreateAuction({ onDone }) {
  const toast = useToast();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(seasonSchema), defaultValues: { name: "APL Auction", year: new Date().getFullYear(), sport: "CRICKET", ...DEFAULTS } });
  const submit = async (d) => {
    try { await post("/admin/season", { name: d.name, year: d.year, sport: d.sport, config: toBody(d) }); toast.success("Auction created"); onDone(); } catch (e) { toast.error(apiError(e).message); }
  };
  const sportField = register("sport");
  return (
    <Card title="Create the auction">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6" noValidate>
        <p className="text-sm text-muted">The values below are provisional development defaults. Replace them with the committee-approved configuration.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Auction name" error={errors.name?.message}>{(a) => <Input {...a} placeholder="e.g. APL Cricket Season 8" {...register("name")} />}</Field>
          <Field label="Sport" hint="Sets the default player categories">{(a) => (
            <Select {...a} {...sportField} onChange={(e) => { sportField.onChange(e); setValue("categories", SPORT_CATEGORIES[e.target.value]); }}>
              <option value="CRICKET">Cricket</option><option value="FOOTBALL">Football</option>
            </Select>
          )}</Field>
          <Field label="Year" error={errors.year?.message}>{(a) => <Input {...a} type="number" inputMode="numeric" {...register("year")} />}</Field>
        </div>
        <ConfigFields register={register} errors={errors} started={false} />
        <div><Button type="submit" variant="primary" pending={isSubmitting}>Create auction</Button></div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { pending, run } = useAction(toast);
  const { data, error, loading, reload } = useResource("/admin/season");
  const [confirm, setConfirm] = useState(null);
  const cfg = data?.config;
  const status = data?.auctionStatus;
  const started = status && !["CREATED", "READY"].includes(status);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(configSchema),
    values: cfg ? { ...Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, String(cfg[k])])), categories: cfg.categories.join(", "), bidIncrements: (cfg.bidIncrements || [3, 5]).join(", "), reason: "" } : undefined,
  });

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (loading && data === null) return <Skeleton rows={8} />;
  if (!data) return <><PageHeader title="Settings" /><CreateAuction onDone={reload} /></>;

  const save = async (d) => {
    const body = toBody(d);
    if (started) { FIN.forEach((k) => delete body[k]); Object.assign(body, { override: true, reason: d.reason || "" }); }
    const r = await run("save", () => patch("/admin/config", body), status === "READY" ? "Saved. Confirm the configuration again before starting." : "Configuration saved");
    if (r.ok) reload();
  };

  return (
    <>
      <PageHeader title="Settings" description={`${data.season.name} · ${SPORT_LABEL[data.season.sport] || "Cricket"} · ${data.season.year} · configuration version ${cfg.version}`} actions={<StatusBadge status={status} />} />
      <div className="flex flex-col gap-6">
        <Card title="Auction lifecycle">
          <ol className="flex flex-col gap-3 text-sm">
            <li>1. Create every team and assign its captain; register players.</li>
            <li>2. Confirm the final configuration (the auction becomes READY). Changing the configuration afterwards returns it to CREATED.</li>
            <li>3. Start the auction. Purses and Mystery Tokens are issued and the configuration snapshot is frozen.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === "CREATED" && <Button variant="primary" disabled={isDirty} onClick={() => setConfirm("confirm")}><CheckCircle2 className="size-4" aria-hidden />Confirm configuration</Button>}
            {status === "READY" && <Button variant="primary" onClick={() => setConfirm("start")}><Play className="size-4" aria-hidden />Start auction</Button>}
            {started && <p className="text-sm text-muted">The auction has started. Financial settings are locked; other changes require a recorded reason.</p>}
          </div>
          {status === "CREATED" && isDirty && <p className="mt-2 text-xs text-warning">Save your changes before confirming.</p>}
        </Card>

        <Card title="Auction configuration">
          <form onSubmit={handleSubmit(save)} className="flex flex-col gap-6" noValidate>
            <ConfigFields register={register} errors={errors} started={started} />
            {started && <Field label="Reason for change (audited)" hint="Required, at least 5 characters">{(a) => <Textarea {...a} {...register("reason")} />}</Field>}
            <div><Button type="submit" variant="primary" pending={isSubmitting || pending === "save"} disabled={!isDirty}>Save configuration</Button></div>
          </form>
        </Card>

        <Card title="Archive this auction">
          <p className="text-sm text-muted">Archive the auction when it is finished (or if it never started) so you can create a new one, for example for another sport. All players, bids, transactions and results are kept. Captains of this auction are signed out and can be assigned to teams in the next auction.</p>
          <div className="mt-4">
            <Button variant="danger" disabled={!["CREATED", "READY", "COMPLETED"].includes(status)} onClick={() => setConfirm("archive")}>Archive auction</Button>
            {!["CREATED", "READY", "COMPLETED"].includes(status) && <p className="mt-2 text-xs text-muted">Available once the auction is completed (Auction control → Complete auction).</p>}
          </div>
        </Card>
      </div>
      <ConfirmDialog open={confirm === "confirm"} title="Confirm configuration?" confirmLabel="Confirm configuration" pending={pending === "confirm"}
        message={`Teams: ${cfg.teamCount}, purse ${cfg.teamPurse}, squad ${cfg.maxSquadSize}, base ${cfg.defaultBasePrice}, raises +${(cfg.bidIncrements || [3, 5]).join(" or +")}, finalization ${cfg.finalizationSeconds}s. Every team must have an active captain.`}
        onClose={() => setConfirm(null)} onConfirm={async () => { const r = await run("confirm", () => post("/admin/config/confirm"), "Configuration confirmed: auction is READY"); if (r.ok) { setConfirm(null); reload(); } }} />
      <ConfirmDialog open={confirm === "archive"} title={`Archive ${data.season.name}?`} confirmLabel="Archive auction" tone="danger" pending={pending === "archive"}
        message="This auction becomes read-only history and its captains are signed out. You can then create a new auction."
        onClose={() => setConfirm(null)} onConfirm={async () => { const r = await run("archive", () => post("/admin/season/archive"), "Auction archived. You can now create a new one."); if (r.ok) { setConfirm(null); reload(); } }} />
      <ConfirmDialog open={confirm === "start"} title="Start the auction?" confirmLabel="Start auction" pending={pending === "start"}
        message="Purses are allocated, each team receives one Mystery Token, and the configuration is frozen. This cannot be undone."
        onClose={() => setConfirm(null)} onConfirm={async () => { const r = await run("start", () => post("/admin/auction/start"), "The auction is LIVE"); if (r.ok) { setConfirm(null); reload(); } }} />
    </>
  );
}
