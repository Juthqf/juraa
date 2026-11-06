import { CheckCircle2 } from "lucide-react";
import { useApp } from "../store";
import { Btn, Mascot } from "../ui";

export function Saved() {
  const { t, go, meds } = useApp();
  const last = meds[meds.length - 1];
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 pb-32 pt-10">
      <div className="w-full space-y-5 text-center">
        <Mascot className="mx-auto h-32 w-auto" float />
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h1 className="font-display text-3xl font-extrabold text-primary">{t("savedTitle")}</h1>
        {last && <p className="text-lg font-bold" dir="ltr">{last.name}{last.dose ? ` · ${last.dose}` : ""}</p>}
        <p className="text-muted-foreground">{t("savedHint")}</p>
        <div className="space-y-3 pt-2">
          <Btn className="w-full" onClick={() => go("meds")}>{t("viewMeds")}</Btn>
          <Btn variant="outline" className="w-full" onClick={() => go("home")}>{t("backHome")}</Btn>
        </div>
      </div>
    </div>
  );
}
