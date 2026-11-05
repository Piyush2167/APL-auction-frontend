import { Suspense } from "react";
import { AuthCard, LoginForm } from "@/components/auth/AuthForms";
import { Spinner } from "@/components/ui";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <AuthCard title="Sign in" description="Administrators and team captains sign in here.">
      <Suspense fallback={<Spinner />}><LoginForm /></Suspense>
    </AuthCard>
  );
}
