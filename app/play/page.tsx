import type { Metadata } from "next";
import { PlayScreen } from "@/components/play/PlayScreen";

export const metadata: Metadata = { title: "식사 시간 · 냠냠캔버스" };

export default function PlayPage() {
  return <PlayScreen />;
}
