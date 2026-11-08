import { Bell, BellOff, ListChecks, Settings2 } from "lucide-react";
import { useApp } from "../store";
import { Btn, Card, Mascot } from "../ui";

// Honest notification setup: no push infrastructure exists yet, so this screen
// never requests permission and never claims background reminders work.
export function NotifySetup() {
  const { t, set, go, back } = useApp();

  const finish = (pref: "inapp" | "later") => {
    set({ notifPref: pref, onboarded: true });
    go("home");
  };

  return (
    <div className="min-h-screen px-6 pb-10 pt-8">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-sage">
          <Mascot className="h-20 w-auto" float />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-primary">{t("notifyTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("notifySub")}</p>
        </div>
      </div>

      <Card className="mt-8 space-y-4">
        {[
          { icon: Bell, k: "notifyPoint1" as const },
          { icon: ListChecks, k: "notifyPoint2" as const },
          { icon: Settings2, k: "notifyPoint3" as const },
        ].map(({ icon: Icon, k }) => (
          <p key={k} className="flex items-center gap-3 font-bold text-primary">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary"><Icon className="size-5" /></span>
            {t(k)}
          </p>
        ))}
      </Card>

      <Card className="mt-4 bg-warning-soft">
        <p className="flex items-start gap-3 text-sm">
          <BellOff className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
          {t("notifyNotAvailable")}
        </p>
      </Card>

      <div className="mt-8 space-y-3">
        <Btn className="w-full" onClick={() => finish("inapp")}>{t("notifyInApp")}</Btn>
        <Btn variant="outline" className="w-full" onClick={() => finish("later")}>{t("notifyLater")}</Btn>
        <Btn variant="ghost" className="w-full" onClick={back}>{t("back")}</Btn>
      </div>
    </div>
  );
}
