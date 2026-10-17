import type { Metadata } from "next";
import { PlayScreen } from "@/components/play/PlayScreen";

export const metadata: Metadata = { title: "자동 시연 · 냠냠캔버스" };

// Exhibition loop: meals play themselves on the simulator, friend after friend.
// Like /demo, nothing touches a parent's account.
export default function AutoDemoPage() {
  return <PlayScreen auto />;
}
