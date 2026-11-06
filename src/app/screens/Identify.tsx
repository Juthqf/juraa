import { CheckCircle2 } from "lucide-react";
import { useApp } from "../store";
import { Btn, DemoBadge, Mascot, TopBar } from "../ui";

export function Identify() {
  const { t, candidate, setCandidate, go } = useApp();
  if (!candidate) { go("scan"); return null; }
  const field = "mt-1 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary";
  return (
    <div className="pb-32">
      <TopBar title={t("identified")} onBack />
      <div className="space-y-5 px-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-sage p-6">
          <Mascot className="absolute -bottom-4 end-0 h-36 w-auto opacity-95" />
          <DemoBadge>{t("simulated")}</DemoBadge>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-success"><CheckCircle2 className="size-5" />{t("dose")}: <span dir="ltr">{candidate.dose}</span></p>
          <p className="mt-1 font-display text-4xl font-extrabold text-primary" dir="ltr">{candidate.name}</p>
          <p className="mt-1 text-muted-foreground" dir="ltr">{candidate.ingredient}</p>
        </div>
        <p className="rounded-2xl bg-warning-soft p-4 text-sm">{t("confirmHint")}</p>
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <label className="block font-bold">{t("name")}<input dir="ltr" className={field} value={candidate.name} onChange={(e) => setCandidate({ ...candidate, name: e.target.value })} /></label>
          <label className="block font-bold">{t("ingredient")}<input dir="ltr" className={field} value={candidate.ingredient} onChange={(e) => setCandidate({ ...candidate, ingredient: e.target.value })} /></label>
          <label className="block font-bold">{t("dose")}<input dir="ltr" className={field} value={candidate.dose} onChange={(e) => setCandidate({ ...candidate, dose: e.target.value })} /></label>
        </div>
        <Btn className="w-full" onClick={() => go("safety")}>{t("continueSafety")}</Btn>
      </div>
    </div>
  );
}
