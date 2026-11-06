import { Check, Moon, Sun, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "../i18n";
import { useApp, useTodayDoses } from "../store";
import { StatusPill, TopBar } from "../ui";

export function Schedule() {
  const { t, lang, toggleTaken } = useApp();
  const doses = useTodayDoses();
  const groups = [
    { k: "morning" as const, icon: Sun, f: (m: number) => m < 12 * 60 },
    { k: "afternoon" as const, icon: Sunset, f: (m: number) => m >= 12 * 60 && m < 18 * 60 },
    { k: "evening" as const, icon: Moon, f: (m: number) => m >= 18 * 60 },
  ];
  const dateStr = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="pb-32">
      <TopBar title={t("timeline")} subtitle={dateStr} onBack />
      <div className="space-y-6 px-5">
        {groups.map(({ k, icon: Icon, f }) => {
          const items = doses.filter((d) => f(d.minutes));
          if (!items.length) return null;
          return (
            <section key={k}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-primary"><Icon className="size-5 text-accent" />{t(k)}</h2>
              <ol className="relative space-y-3 border-s-2 border-dashed border-secondary ps-5">
                {items.map((d) => {
                  const done = d.status === "taken";
                  return (
                    <li key={d.med.id + d.time} className="relative">
                      <span className={cn("absolute -start-[1.95rem] top-6 size-4 rounded-full ring-4 ring-background", done ? "bg-success" : "bg-accent")} />
                      <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
                        <div>
                          <p className="text-sm font-bold text-muted-foreground" dir="ltr">{formatTime(d.time, lang)}</p>
                          <p className="text-lg font-bold" dir="ltr">{d.med.name} · {d.med.dose}</p>
                          <div className="mt-1"><StatusPill status={d.status} /></div>
                        </div>
                        <button
                          onClick={() => toggleTaken(d.med.id, d.time)}
                          aria-pressed={done}
                          className={cn("flex min-h-14 min-w-24 flex-col items-center justify-center rounded-2xl px-3 text-xs font-bold transition", done ? "bg-success text-primary-foreground" : "border-2 border-primary/25 text-primary")}
                        >
                          <Check className="size-6" />
                          {done ? t("undo") : t("markTaken")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
