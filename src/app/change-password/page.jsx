import { AuthCard, ChangePasswordForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Set password" };

export default function Page() {
  return <AuthCard title="Set your password"><ChangePasswordForm /></AuthCard>;
}
