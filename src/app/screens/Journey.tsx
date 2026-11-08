import { CalendarDays, Flame, Pill, ShieldCheck, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { bucketWeekly, computeJourney, type JourneyRange } from "../journey";
import { useApp } from "../store";
import { Card, TopBar } from "../ui";

const RANGES: { r: JourneyRange; k: "journeyRangeToday" | "journeyRangeWeek" | "journeyRangeMonth" | "journeyRangeAll" }[] = [
  { r: "today", k: "journeyRangeToday" },
  { r: "week", k: "journeyRangeWeek" },
  { r: "month", k: "journeyRangeMonth" },
  { r: "all", k: "journeyRangeAll" },
];

export function Journey() {
  const { t, meds, taken } = useApp();
  const [range, setRange] = useState<JourneyRange>("week");
  const stats = useMemo(() => computeJourney(meds, taken, range), [meds, taken, range]);
  const bars = useMemo(() => bucketWeekly(stats.days), [stats.days]);

  return (
    <div className="pb-32">
      <TopBar title={t("journeyTitle")} subtitle={t("journeySubtitle")} onBack />

      <div className="space-y-5 px-5">
        <div role="group" aria-label={t("journeyTitle")} className="grid grid-cols-4 gap-2">
          {RANGES.map(({ r, k }) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`min-h-11 rounded-2xl border text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                range === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary"
              }`}
            >
              {t(k)}
            </button>
          ))}
        </div>

        {!stats.hasHistory && stats.eligible === 0 ? (
          <Card className="text-center">
            <TrendingUp className="mx-auto size-10 text-primary" />
            <p className="mt-3 font-bold text-primary">{t("journeyNoData")}</p>
          </Card>
        ) : (
          <>
            <Card className="pattern-sadu bg-hero text-primary-foreground shadow-float">
              <p className="text-sm font-bold text-accent">{t("journeyAdherence")}</p>
              {stats.adherence === null ? (
                <p className="mt-2 font-display text-2xl font-extrabold">{t("journeyUnavailable")}</p>
              ) : (
                <p className="mt-1 font-display text-5xl font-extrabold" dir="ltr">
                  {stats.adherence}%
                </p>
              )}
              <p className="mt-2 text-sm opacity-90">
                {t("journeyTakenCount").replace("{taken}", String(stats.taken)).replace("{eligible}", String(stats.eligible))}
              </p>
              <p className="mt-3 border-t border-primary-foreground/20 pt-3 text-xs opacity-80">{t("journeyHowCalc")}</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-success-soft">
                <p className="font-display text-3xl font-extrabold text-success" dir="ltr">{stats.taken}</p>
                <p className="mt-1 text-sm font-bold text-success">{t("journeyTaken")}</p>
              </Card>
              <Card className="bg-warning-soft">
                <p className="font-display text-3xl font-extrabold text-accent-foreground" dir="ltr">{stats.unconfirmed}</p>
                <p className="mt-1 text-sm font-bold text-accent-foreground">{t("journeyUnconfirmed")}</p>
                <p className="mt-1 text-xs text-accent-foreground/80">{t("journeyUnconfirmedNote")}</p>
              </Card>
              <Card>
                <p className="font-display text-3xl font-extrabold text-muted-foreground">{t("journeyUnavailable")}</p>
                <p className="mt-1 text-sm font-bold text-primary">{t("journeySkipped")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("journeySkippedNote")}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2">
                  <Pill className="size-6 text-primary" />
                  <p className="font-display text-3xl font-extrabold text-primary" dir="ltr">{stats.activeMeds}</p>
                </div>
                <p className="mt-1 text-sm font-bold text-primary">{t("journeyActiveMeds")}</p>
              </Card>
            </div>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="size-6 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-primary">{t("journeyStreak")}</p>
                    <p className="font-display text-xl font-extrabold text-primary" dir="ltr">
                      {stats.streak === null ? t("journeyUnavailable") : `${stats.streak} ${t("journeyDays")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-6 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-primary">{t("journeySince")}</p>
                    <p className="font-display text-xl font-extrabold text-primary" dir="ltr">{stats.since ?? t("journeyUnavailable")}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <p className="font-bold text-primary">{t("journeyChart")}</p>
              <div className="mt-4 flex h-32 items-end gap-1" role="img" aria-label={t("journeyChart")}>
                {bars.map((d) => {
                  const pct = d.eligible > 0 ? Math.round((d.taken / d.eligible) * 100) : 0;
                  return (
                    <div
                      key={d.date}
                      aria-label={`${d.date}: ${d.taken} / ${d.eligible}`}
                      className={`flex-1 rounded-t-lg ${d.eligible === 0 ? "bg-muted" : pct === 100 ? "bg-primary" : pct > 0 ? "bg-secondary" : "bg-warning"}`}
                      style={{ height: `${d.eligible === 0 ? 6 : Math.max(8, pct)}%` }}
                      title={`${d.date}: ${d.taken} / ${d.eligible}`}
                    />
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("journeyScheduleNote")}</p>
            </Card>
          </>
        )}

        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold text-primary">{t("journeyInteractions")}</h2>
          <Card className="border-dashed">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-7 shrink-0 text-primary" />
              <div>
                <p className="font-bold text-primary">{t("journeyInteractionsPending")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("journeyInteractionsNote")}</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
