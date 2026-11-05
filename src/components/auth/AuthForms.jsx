"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { useAuth, homeFor } from "@/contexts/AuthContext";
import { apiError, post } from "@/services/api/client";
import { Logo } from "@/components/shared";
import { loginSchema, changePasswordSchema, forgotSchema, resetSchema } from "@/validations/auth";

export function AuthCard({ title, description, children, footer }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <a href="/"><Logo /></a>
        <div className="mt-4 rounded-xl border border-line bg-surface p-6">
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}

const FormError = ({ error }) => (error ? <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null);

/** Only allow same-site relative redirects. */
const safeNext = (n) => (n && n.startsWith("/") && !n.startsWith("//") ? n : null);

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });
  const onSubmit = async ({ email, password }) => {
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(user.mustChangePassword ? "/change-password" : next || homeFor(user));
    } catch (e) { setError(apiError(e).message); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormError error={error} />
      <Field label="Email" error={errors.email?.message}>{(a) => <Input {...a} type="email" autoComplete="email" {...register("email")} />}</Field>
      <Field label="Password" error={errors.password?.message}>{(a) => <Input {...a} type="password" autoComplete="current-password" {...register("password")} />}</Field>
      <Button type="submit" variant="primary" pending={isSubmitting}>Sign in</Button>
      <Link href="/forgot-password" className="text-center text-sm text-muted hover:text-fg">Forgot your password?</Link>
    </form>
  );
}

export function ChangePasswordForm() {
  const { changePassword, user, status } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(changePasswordSchema) });
  useEffect(() => { if (status === "anonymous") router.replace("/login"); }, [status, router]);
  if (status !== "authenticated") return <Spinner />;
  const onSubmit = async (d) => {
    setError(null);
    try {
      const u = await changePassword(d.currentPassword, d.newPassword);
      router.replace(homeFor(u));
    } catch (e) { setError(apiError(e).message); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {user?.mustChangePassword && <p className="rounded-md border border-info/40 bg-info/10 px-3 py-2 text-sm text-info">Set your own password before continuing. Your temporary password stops working afterwards.</p>}
      <FormError error={error} />
      <Field label={user?.mustChangePassword ? "Temporary password" : "Current password"} error={errors.currentPassword?.message}>{(a) => <Input {...a} type="password" autoComplete="current-password" {...register("currentPassword")} />}</Field>
      <Field label="New password" hint="At least 8 characters, with a letter and a number" error={errors.newPassword?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...register("newPassword")} />}</Field>
      <Field label="Confirm new password" error={errors.confirm?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...register("confirm")} />}</Field>
      <Button type="submit" variant="primary" pending={isSubmitting}>Save password</Button>
    </form>
  );
}

export function ForgotForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) });
  if (done) return <p className="text-sm">If an account exists for that email, a reset link is on its way. It expires in 30 minutes.</p>;
  return (
    <form onSubmit={handleSubmit(async (d) => { setError(null); try { await post("/auth/forgot-password", d); setDone(true); } catch (e) { setError(apiError(e).message); } })} className="flex flex-col gap-4" noValidate>
      <FormError error={error} />
      <Field label="Email" error={errors.email?.message}>{(a) => <Input {...a} type="email" autoComplete="email" {...register("email")} />}</Field>
      <Button type="submit" variant="primary" pending={isSubmitting}>Send reset link</Button>
    </form>
  );
}

export function ResetForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) });
  if (!token) return <FormError error="This reset link is incomplete. Request a new one." />;
  const onSubmit = async (d) => {
    setError(null);
    try { await post("/auth/reset-password", { token, password: d.password }); router.replace("/login"); } catch (e) { setError(apiError(e).message); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormError error={error} />
      <Field label="New password" hint="At least 8 characters, with a letter and a number" error={errors.password?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...register("password")} />}</Field>
      <Field label="Confirm new password" error={errors.confirm?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...register("confirm")} />}</Field>
      <Button type="submit" variant="primary" pending={isSubmitting}>Set new password</Button>
    </form>
  );
}
