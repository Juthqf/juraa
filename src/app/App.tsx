import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp, type Screen } from "./store";
import { BottomNav, Mascot } from "./ui";
import { Chat } from "./screens/Chat";
import { Home } from "./screens/Home";
import { Identify } from "./screens/Identify";
import { Meds } from "./screens/Meds";
import { Onboarding } from "./screens/Onboarding";
import { Profile } from "./screens/Profile";
import { Safety } from "./screens/Safety";
import { Saved } from "./screens/Saved";
import { Scan } from "./screens/Scan";
import { Schedule } from "./screens/Schedule";

const SCREENS: Record<Screen, () => React.ReactNode> = {
  onboarding: Onboarding, home: Home, meds: Meds, schedule: Schedule, scan: Scan,
  identify: Identify, safety: Safety, saved: Saved, chat: Chat, profile: Profile,
};

function Frame() {
  const { screen, hydrated } = useApp();
  if (!hydrated) return <div className="grid min-h-screen place-items-center"><Mascot className="h-32 w-auto" float /></div>;
  const S = SCREENS[screen];
  return (
    <>
      <S />
      {screen !== "onboarding" && <BottomNav />}
    </>
  );
}

export function KabsoulApp() {
  return (
    <AppProvider>
      <main className="mx-auto min-h-screen max-w-md bg-background">
        <Frame />
      </main>
      <Toaster position="top-center" />
    </AppProvider>
  );
}
