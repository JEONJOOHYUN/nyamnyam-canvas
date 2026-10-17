import type { Metadata } from "next";
import { PlayScreen } from "@/components/play/PlayScreen";

export const metadata: Metadata = { title: "체험해 보기 · 냠냠캔버스" };

// Demo mode: anyone can try a meal with the simulator, also on Production.
// Nothing is read from or saved to a parent's account.
export default function DemoPage() {
  return <PlayScreen demo />;
}
