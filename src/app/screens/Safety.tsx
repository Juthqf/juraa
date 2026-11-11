import { AlertOctagon, Clock, HelpCircle, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useClinicalData } from "../clinical-data";
import { RecordCard } from "../RecordCard";
import { checkSafety, itemRecordsForMed, overall, resolve, type SafetyCategory } from "../safety";
import { useApp } from "../store";
import { Btn, DemoBadge, Mascot, TopBar } from "../ui";
import { MedForm } from "./Meds";

const STYLE: Record<SafetyCategory, { box: string; icon: typeof AlertOctagon; ic: string }> = {
  avoid: { box: "border-destructive/30 bg-danger-soft", icon: AlertOctagon, ic: "text-destructive" },
  caution: { box: "border-warning bg-warning-soft", icon: Clock, ic: "text-accent-foreground" },
  none: { box: "border-border bg-info-soft", icon: Info, ic: "text-primary" },
  insufficient: { box: "border-border bg-info-soft", icon: HelpCircle, ic: "text-primary" },
};

export function Safety() {
  const { t, candidate, meds, go } = useApp();
  const clinical = useClinicalData();
  const [adding, setAdding] = useState(false);
  if (!candidate) { go("scan"); return null; }
  const texts = [candidate.ingredient, candidate.genericName, candidate.name];
  const db = clinical.status === "ready" ? clinical.db : null;
  const results = db ? checkSafety(db, texts, meds) : [];
  const entity = db ? resolve(db, texts) : null;
  const top: SafetyCategory = !entity ? "insufficient" : results.length ? overall(results) : "none";
  const S = STYLE[top];
  const itemRecs = db && entity?.kind === "med" ? itemRecordsForMed(db, entity.med.id) : [];

  return (
    <div className="pb-32">
      <TopBar title={t("safetyTitle")} subtitle={t("comparedWith")} onBack />
      <div className="space-y-4 px-5">
        <DemoBadge>{t("demoData")}</DemoBadge>
        {clinical.status !== "ready" ? (
          <p role="status" className="rounded-3xl border border-border bg-info-soft p-5">{t(clinical.status === "loading" ? "dbLoading" : "dbError")}</p>
        ) : <>
          <div className={cn("flex items-center gap-4 rounded-[2rem] border-2 p-6", S.box)}>
            <div className="min-w-0 flex-1">
              <S.icon className={cn("size-10", S.ic)} />
              <p className="mt-2 break-words font-display text-2xl font-extrabold">{t(`cat_${top}`)}</p>
              <p className="mt-1 break-words text-lg font-bold" dir="ltr">{candidate.name}</p>
              {entity?.kind === "med" && entity.med.timing_ar && <p className="mt-2 text-sm" dir="rtl"><b>{t("medTiming")}: </b>{entity.med.timing_ar}{entity.med.meal_ar ? ` — ${entity.med.meal_ar}` : ""}</p>}
            </div>
            <Mascot className="h-24 w-auto shrink-0" />
          </div>

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
                {r.records.map((rec) => <RecordCard key={rec.id} r={rec} />)}
                {r.category === "none" && <p className="mt-2 text-sm">{t("noneNotSafe")}</p>}
                {r.category === "insufficient" && <p className="mt-2 text-sm">{t("insufficientReason")}</p>}
              </div>
            );
          })}
          {!entity && <div className={cn("rounded-3xl border p-5", STYLE.insufficient.box)}>{t("insufficientReason")}</div>}

          {itemRecs.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-extrabold text-primary">{t("itemRecords")}</h2>
              {itemRecs.map((rec) => {
                const it = db?.items.find((i) => i.id === rec.itemId);
                return (
                  <div key={rec.id} className={cn("rounded-3xl border p-5", STYLE[rec.action_level === "avoid" ? "avoid" : "caution"].box)}>
                    <p className="font-bold" dir="rtl">{it?.name_ar} <span dir="ltr" className="text-sm opacity-70">({it?.name_en})</span></p>
                    <RecordCard r={rec} />
                  </div>
                );
              })}
            </section>
          )}
        </>}

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
