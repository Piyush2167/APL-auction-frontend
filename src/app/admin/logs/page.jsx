import { Suspense } from "react";
import LogsView from "@/components/admin/LogsView";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "History & logs" };

export default function Page() {
  return <Suspense fallback={<Skeleton rows={6} />}><LogsView /></Suspense>;
}
