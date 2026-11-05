import { Suspense } from "react";
import { AuthCard, ResetForm } from "@/components/auth/AuthForms";
import { Spinner } from "@/components/ui";

export const metadata = { title: "Set new password" };

export default function Page() {
  return (
    <AuthCard title="Set a new password">
      <Suspense fallback={<Spinner />}><ResetForm /></Suspense>
    </AuthCard>
  );
}
