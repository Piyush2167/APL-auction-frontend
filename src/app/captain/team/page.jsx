"use client";
import TeamHeader from "@/components/captain/TeamHeader";
import Squad from "@/components/captain/Squad";

export default function Page() {
  return <div className="flex flex-col gap-6"><TeamHeader /><Squad /></div>;
}
