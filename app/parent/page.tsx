import type { Metadata } from "next";
import { ParentApp } from "@/components/parent/ParentApp";

export const metadata: Metadata = { title: "부모 설정 · 냠냠캔버스" };

export default function ParentPage() {
  return <ParentApp />;
}
