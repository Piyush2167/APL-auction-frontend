"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Field, Input, Select, Modal } from "@/components/ui";
import { post, patch, apiError } from "@/services/api/client";
import { useToast } from "@/contexts/ToastContext";

const list = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);
const schema = z.object({
  name: z.string().trim().min(2, "Enter the full name").max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  category: z.string().min(1, "Choose a category"),
  playerType: z.enum(["NORMAL", "MYSTERY"]),
  basePrice: z.union([z.literal(""), z.coerce.number().int("Whole numbers only").min(0, "Cannot be negative")]),
  auctionOrder: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  battingStyle: z.string().max(60), bowlingStyle: z.string().max(60), experience: z.string().max(200),
  registrationId: z.string().max(40), image: z.union([z.literal(""), z.url("Enter a full https:// URL")]),
  skills: z.string().max(500), publicSkills: z.string().max(500),
});

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const { url } = await post("/admin/uploads/image", fd);
  return url;
}

export default function PlayerForm({ open, onClose, player, categories, defaultBasePrice, sport = "CRICKET", onSaved }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const editing = !!player;
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: player?.name || "", gender: player?.gender || "Male", category: player?.category || categories?.[0] || "",
      playerType: player?.playerType || "NORMAL", basePrice: player?.basePrice ?? "", auctionOrder: player?.auctionOrder ?? "",
      battingStyle: player?.battingStyle || "", bowlingStyle: player?.bowlingStyle || "", experience: player?.experience || "",
      registrationId: player?.registrationId || "", image: player?.image || "",
      skills: (player?.skills || []).join(", "), publicSkills: (player?.publicSkills || []).join(", "),
    },
  });
  const mystery = watch("playerType") === "MYSTERY";
  const locked = editing && !["AVAILABLE", "UNSOLD", "SKIPPED", "RESALE_APPROVED"].includes(player.status);

  const onSubmit = async (d) => {
    const body = {
      name: d.name, gender: d.gender, category: d.category, battingStyle: d.battingStyle, bowlingStyle: d.bowlingStyle,
      experience: d.experience, registrationId: d.registrationId || null, image: d.image || null,
      skills: list(d.skills), publicSkills: list(d.publicSkills),
      ...(locked ? {} : { playerType: d.playerType, ...(d.basePrice !== "" ? { basePrice: d.basePrice } : {}) }),
      ...(d.auctionOrder !== "" ? { auctionOrder: d.auctionOrder } : {}),
    };
    try {
      const saved = editing ? await patch(`/admin/players/${player.id}`, body) : await post("/admin/players", body);
      toast.success(editing ? "Player updated" : `${saved.name} added`);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      const err = apiError(e);
      if (err.code === "DUPLICATE_PLAYER") setError("name", { message: err.message });
      else if (err.details?.length) err.details.forEach((x) => setError(x.path || "root", { message: x.message }));
      else toast.error(err.message);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setValue("image", await uploadImage(file), { shouldDirty: true }); toast.success("Image uploaded"); } catch (err) { toast.error(apiError(err).message); } finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={editing ? `Edit ${player.name}` : "Add player"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" pending={isSubmitting} onClick={handleSubmit(onSubmit)}>{editing ? "Save changes" : "Add player"}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><Field label="Full name" error={errors.name?.message}>{(a) => <Input {...a} autoComplete="off" {...register("name")} />}</Field></div>
        <Field label="Player type" hint={locked ? `Locked while ${player.status}` : "Mystery players are masked for the audience"}>{(a) => <Select {...a} disabled={locked} {...register("playerType")}><option value="NORMAL">Normal</option><option value="MYSTERY">Mystery</option></Select>}</Field>
        <Field label="Category" error={errors.category?.message}>{(a) => <Select {...a} {...register("category")}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        <Field label="Gender">{(a) => <Select {...a} {...register("gender")}><option>Male</option><option>Female</option><option>Other</option></Select>}</Field>
        <Field label="Base price (points)" hint={locked ? `Locked while ${player.status}` : `Empty uses the default (${defaultBasePrice})`} error={errors.basePrice?.message}>{(a) => <Input {...a} type="number" inputMode="numeric" min={0} disabled={locked} {...register("basePrice")} />}</Field>
        {sport === "CRICKET" && <Field label="Batting style">{(a) => <Input {...a} {...register("battingStyle")} />}</Field>}
        {sport === "CRICKET" && <Field label="Bowling style">{(a) => <Input {...a} {...register("bowlingStyle")} />}</Field>}
        <Field label="Experience">{(a) => <Input {...a} placeholder="e.g. 3 seasons" {...register("experience")} />}</Field>
        <Field label="Registration ID" hint="Optional; must be unique">{(a) => <Input {...a} {...register("registrationId")} />}</Field>
        <Field label="Auction order" hint="Empty adds to the end">{(a) => <Input {...a} type="number" inputMode="numeric" min={0} {...register("auctionOrder")} />}</Field>
        <div className="sm:col-span-2"><Field label="Skills" hint="Comma separated" error={errors.skills?.message}>{(a) => <Input {...a} {...register("skills")} />}</Field></div>
        {mystery && <div className="sm:col-span-2"><Field label="Public skills (shown while masked)" hint="Only non-identifying skills, comma separated">{(a) => <Input {...a} {...register("publicSkills")} />}</Field></div>}
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Field label="Image URL" error={errors.image?.message}>{(a) => <Input {...a} type="url" placeholder="https://" {...register("image")} />}</Field>
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-accent hover:underline">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} disabled={uploading} />
            {uploading ? "Uploading…" : "Or upload an image (PNG, JPEG, WebP, max 3 MB)"}
          </label>
        </div>
      </form>
    </Modal>
  );
}
