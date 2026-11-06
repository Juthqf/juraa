import { AlertOctagon, Clock, HelpCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { checkSafety, overall, type SafetyCategory } from "../safety";
import { useApp } from "../store";
import { Btn, DemoBadge, Mascot, TopBar } from "../ui";
import { MedForm } from "./Meds";

const STYLE: Record<SafetyCategory, { box: string; icon: typeof AlertOctagon; ic: string }> = {
  interaction: { box: "border-destructive/30 bg-danger-soft", icon: AlertOctagon, ic: "text-destructive" },
  timing: { box: "border-warning bg-warning-soft", icon: Clock, ic: "text-accent-foreground" },
  none: { box: "border-success/30 bg-success-soft", icon: ShieldCheck, ic: "text-success" },
  insufficient: { box: "border-border bg-info-soft", icon: HelpCircle, ic: "text-primary" },
};

export function Safety() {
  const { t, lang, candidate, meds, go } = useApp();
  const [adding, setAdding] = useState(false);
  if (!candidate) { go("scan"); return null; }
  const results = checkSafety(candidate.ingredient, meds);
  const top = overall(results);
  const S = STYLE[top];

  return (
    <div className="pb-32">
      <TopBar title={t("safetyTitle")} subtitle={t("comparedWith")} onBack />
      <div className="space-y-4 px-5">
        <div className={cn("flex items-center gap-4 rounded-[2rem] border-2 p-6", S.box)}>
          <div className="min-w-0 flex-1">
            <S.icon className={cn("size-10", S.ic)} />
            <p className="mt-2 break-words font-display text-2xl font-extrabold">{t(`cat_${top}`)}</p>
            <p className="mt-1 break-words text-lg font-bold" dir="ltr">{candidate.name}</p>
          </div>
          <Mascot className="h-24 w-auto shrink-0" />
        </div>
        <DemoBadge>{t("demoData")}</DemoBadge>

        {results.map((r) => {
          const s = STYLE[r.category];
          return (
            <div key={r.against.id} className={cn("rounded-3xl border p-5", s.box)}>
              <div className="flex items-center gap-3">
                <s.icon className={cn("size-7 shrink-0", s.ic)} />
                <div className="min-w-0">
                  <p className="break-words font-bold" dir="ltr">{candidate.name} + {r.against.name}</p>
                  <p className="text-sm font-bold opacity-80">{t(`cat_${r.category}`)}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div><dt className="inline font-bold">{t("reason")}: </dt><dd className="inline">{r.entry ? r.entry.reason[lang] : r.category === "none" ? t("noneReason") : t("insufficientReason")}</dd></div>
                {r.entry?.severity && <div><dt className="inline font-bold">{t("severity")}: </dt><dd className="inline">{t(`sev_${r.entry.severity}`)}</dd></div>}
                <div><dt className="inline font-bold">{t("reference")}: </dt><dd className="inline" dir="ltr">{r.entry?.reference ?? "—"}</dd></div>
              </dl>
            </div>
          );
        })}
        {results.length === 0 && <div className={cn("rounded-3xl border p-5", STYLE.insufficient.box)}>{t("insufficientReason")}</div>}

        <p className="rounded-2xl bg-muted p-4 text-sm font-bold">{t("disclaimer")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="outline" onClick={() => go("chat")}>{t("askPharmacist")}</Btn>
          <Btn onClick={() => setAdding(true)}>{t("addToMeds")}</Btn>
        </div>
      </div>
      {adding && (
        <MedForm
          initial={null}
          prefill={{ name: candidate.name, ingredient: candidate.ingredient, strength: candidate.dose, genericName: candidate.genericName ?? "", dosageForm: candidate.dosageForm ?? "" }}
          onClose={() => { setAdding(false); }}
          onSaved={() => { setAdding(false); go("saved"); }}
        />
      )}
    </div>
  );
}
