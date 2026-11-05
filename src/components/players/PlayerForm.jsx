"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Field, Input, Select, Modal } from "@/components/ui";
import { post, patch, apiError } from "@/services/api/client";
import { useToast } from "@/contexts/ToastContext";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the full name").max(100),
  skill: z.string().min(1, "Choose a skill"),
  gender: z.enum(["Male", "Female", "Other"]),
  playerType: z.enum(["NORMAL", "MYSTERY"]),
  image: z.union([z.literal(""), z.string().regex(/^\/players\/[\w.-]+$/), z.url("Enter a full https:// URL")]),
});

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const { url } = await post("/admin/uploads/image", fd);
  return url;
}

/**
 * Add: name, skill, gender, image. New players are NORMAL and get the auction's default base price.
 * Edit: the same fields plus player type (switch to MYSTERY later).
 * The skill is the auction category (Batsman, Bowler… / Goalkeeper, Defender…).
 */
export default function PlayerForm({ open, onClose, player, categories, defaultBasePrice, onSaved }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const editing = !!player;
  const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: player?.name || "", skill: player?.category || categories?.[0] || "", gender: player?.gender || "Male",
      playerType: player?.playerType || "NORMAL", image: player?.image || "",
    },
  });
  const typeLocked = editing && !["AVAILABLE", "UNSOLD", "SKIPPED", "RESALE_APPROVED"].includes(player.status);

  const onSubmit = async (d) => {
    // skills/publicSkills mirror the chosen skill, so masked mystery players still show it publicly.
    const body = { name: d.name, gender: d.gender, category: d.skill, skills: [d.skill], publicSkills: [d.skill], image: d.image || null };
    if (editing && !typeLocked) body.playerType = d.playerType;
    try {
      const saved = editing ? await patch(`/admin/players/${player.id}`, body) : await post("/admin/players", body);
      toast.success(editing ? "Player updated" : `${saved.name} added`);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      const err = apiError(e);
      if (err.code === "DUPLICATE_PLAYER") setError("name", { message: err.message });
      else toast.error(err.details?.[0]?.message || err.message);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setValue("image", await uploadImage(file), { shouldDirty: true }); toast.success("Image uploaded"); } catch (err) { toast.error(apiError(err).message); } finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${player.name}` : "Add player"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" pending={isSubmitting} onClick={handleSubmit(onSubmit)}>{editing ? "Save changes" : "Add player"}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><Field label="Full name" error={errors.name?.message}>{(a) => <Input {...a} autoComplete="off" {...register("name")} />}</Field></div>
        <Field label="Skill" error={errors.skill?.message}>{(a) => <Select {...a} {...register("skill")}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        <Field label="Gender">{(a) => <Select {...a} {...register("gender")}><option>Male</option><option>Female</option><option>Other</option></Select>}</Field>
        {editing && (
          <div className="sm:col-span-2">
            <Field label="Player type" hint={typeLocked ? `Locked while ${player.status}` : "Mystery players are masked for the audience"}>{(a) => (
              <Select {...a} disabled={typeLocked} {...register("playerType")}><option value="NORMAL">Normal</option><option value="MYSTERY">Mystery</option></Select>
            )}</Field>
          </div>
        )}
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Field label="Image URL" error={errors.image?.message}>{(a) => <Input {...a} type="text" placeholder="https://" {...register("image")} />}</Field>
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-accent hover:underline">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} disabled={uploading} />
            {uploading ? "Uploading…" : "Or upload an image (PNG, JPEG, WebP, max 3 MB)"}
          </label>
        </div>
        {!editing && <p className="sm:col-span-2 text-xs text-muted">New players are added as Normal with the auction&apos;s base price of {defaultBasePrice} points. You can make a player Mystery later by editing them.</p>}
      </form>
    </Modal>
  );
}
