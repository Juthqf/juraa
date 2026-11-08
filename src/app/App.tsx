import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp, type Screen } from "./store";
import { BottomNav } from "./ui";
import { LaunchWelcome } from "./WelcomeSplash";
import { Chat } from "./screens/Chat";
import { Home } from "./screens/Home";
import { Identify } from "./screens/Identify";
import { Meds } from "./screens/Meds";
import { NotifySetup } from "./screens/NotifySetup";
import { Nutrition } from "./screens/Nutrition";
import { Onboarding } from "./screens/Onboarding";
import { Personalize } from "./screens/Personalize";
import { Profile } from "./screens/Profile";
import { Safety } from "./screens/Safety";
import { Saved } from "./screens/Saved";
import { Scan } from "./screens/Scan";
import { Schedule } from "./screens/Schedule";

const SCREENS: Record<Screen, () => React.ReactNode> = {
  onboarding: Onboarding, personalize: Personalize, notifySetup: NotifySetup,
  home: Home, meds: Meds, schedule: Schedule, scan: Scan,
  identify: Identify, safety: Safety, saved: Saved, chat: Chat, profile: Profile, nutrition: Nutrition,
};

function Frame() {
  const { screen, hydrated } = useApp();
  const S = SCREENS[screen];
  return (
    <LaunchWelcome ready={hydrated}>
      <S />
      {screen !== "onboarding" && screen !== "personalize" && screen !== "notifySetup" && <BottomNav />}
    </LaunchWelcome>
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
