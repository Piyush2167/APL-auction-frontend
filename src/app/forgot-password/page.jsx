import Link from "next/link";
import { AuthCard, ForgotForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Forgot password" };

export default function Page() {
  return (
    <AuthCard title="Reset your password" description="We will email you a link to set a new password." footer={<Link href="/login" className="hover:text-fg">Back to sign in</Link>}>
      <ForgotForm />
    </AuthCard>
  );
}
