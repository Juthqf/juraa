import { AlertTriangle, Camera, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { formatTime } from "../i18n";
import { checkSafety } from "../safety";
import { useApp, useTodayDoses } from "../store";
import { Btn, Card, LangToggle, Mascot, StatusPill } from "../ui";

export function Home() {
  const { t, lang, go, toggleTaken, meds } = useApp();
  const doses = useTodayDoses();
  const next = doses.find((d) => d.status === "upcoming") ?? doses.find((d) => d.status === "missed");
  const takenCount = doses.filter((d) => d.status === "taken").length;
  const pct = doses.length ? Math.round((takenCount / doses.length) * 100) : 0;
  const Chev = lang === "ar" ? ChevronLeft : ChevronRight;

  const alerts = useMemo(
    () => meds.flatMap((m, i) => checkSafety(m.ingredient, meds.slice(i + 1)).filter((r) => r.category === "interaction" || r.category === "timing").map((r) => ({ a: m, ...r }))),
    [meds],
  );

  const hour = new Date().getHours();
  return (
    <div className="space-y-5 px-5 pb-32 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-20 place-items-center rounded-3xl bg-sage">
            <Mascot className="h-20 w-auto" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-primary">{hour < 15 ? t("goodMorning") : t("goodEvening")}</h1>
            <p className="text-sm text-muted-foreground">{t("greetLine")}</p>
          </div>
        </div>
        <LangToggle />
      </header>

      {next ? (
        <div className="pattern-sadu relative overflow-hidden rounded-[2rem] bg-hero p-6 text-primary-foreground shadow-float">
          <p className="text-sm font-bold text-accent">{t("nextDose")}</p>
          <p className="mt-1 font-display text-5xl font-extrabold" dir="ltr">{formatTime(next.time, lang)}</p>
          <p className="mt-2 text-lg" dir="ltr">{next.med.name} · {next.med.dose}</p>
          <Btn variant="gold" className="mt-5 w-full" onClick={() => toggleTaken(next.med.id, next.time)}>{t("markTaken")}</Btn>
        </div>
      ) : (
        <Card className="bg-success-soft text-center font-bold text-success">{t("allDone")}</Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card onClick={() => go("scan")} className="bg-sage">
          <Camera className="size-8 text-primary" />
          <p className="mt-3 font-bold text-primary">{t("scanMed")}</p>
          <p className="text-xs text-muted-foreground">{t("scanMedSub")}</p>
        </Card>
        <Card onClick={() => go("chat")}>
          <MessageCircle className="size-8 text-accent" />
          <p className="mt-3 font-bold text-primary">{t("askAssistant")}</p>
          <p className="text-xs text-muted-foreground">{t("askAssistantSub")}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary">{t("adherence")}</p>
          <p className="font-display text-2xl font-extrabold text-primary">{pct}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      {alerts.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold text-primary">{t("safetyAlerts")}</h2>
          <div className="space-y-3">
            {alerts.map((al) => (
              <Card key={al.a.id + al.against.id} className={al.category === "interaction" ? "border-destructive/30 bg-danger-soft" : "border-warning bg-warning-soft"}>
                <div className="flex gap-3">
                  <AlertTriangle className={al.category === "interaction" ? "size-6 shrink-0 text-destructive" : "size-6 shrink-0 text-accent-foreground"} />
                  <div>
                    <p className="font-bold" dir="ltr">{al.a.name} + {al.against.name}</p>
                    <p className="text-sm">{al.entry?.reason[lang]}</p>
                    <p className="mt-1 text-xs opacity-70">{t("demoData")}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-primary">{t("todayMeds")}</h2>
          <button onClick={() => go("schedule")} className="flex min-h-11 items-center gap-1 text-sm font-bold text-accent-foreground">
            {t("viewSchedule")} <Chev className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          {doses.map((d) => (
            <Card key={d.med.id + d.time} onClick={() => go("meds")} className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold" dir="ltr">{d.med.name}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{d.med.dose} · {formatTime(d.time, lang)}</p>
              </div>
              <StatusPill status={d.status} />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
