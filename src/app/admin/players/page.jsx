import { Suspense } from "react";
import PlayersAdmin from "@/components/players/PlayersAdmin";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Players" };

export default function Page() {
  return <Suspense fallback={<Skeleton rows={6} />}><PlayersAdmin /></Suspense>;
}
