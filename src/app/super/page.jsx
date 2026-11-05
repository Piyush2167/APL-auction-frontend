import { Suspense } from "react";
import MysteryBoard from "@/components/mystery/MysteryBoard";

export const metadata = { title: "Mystery Players" };

export default function Page() {
  // MysteryBoard reads ?key= from the URL, which needs a Suspense boundary in the App Router.
  return <Suspense><MysteryBoard /></Suspense>;
}
