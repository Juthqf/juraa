import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, type Companion } from "../store";
import { Btn, Mascot } from "../ui";

export function Onboarding() {
  const { t, lang, set, companion, go } = useApp();
  return (
    <div className="min-h-screen pb-10">
      <div className="pattern-sadu relative overflow-hidden rounded-b-[2.5rem] bg-hero px-6 pb-10 pt-10 text-primary-foreground">
        <div className="flex gap-2">
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => set({ lang: l })}
              className={cn("min-h-11 rounded-full px-5 text-sm font-bold transition", lang === l ? "bg-primary-foreground text-primary" : "border border-primary-foreground/40")}
            >
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-accent">{t("chooseLang")} · {lang === "ar" ? "العربية" : "English"}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">{t("appName")}</h1>
        <p className="mt-2 text-lg opacity-90">{t("tagline")}</p>
      </div>

      <section className="px-6 pt-8">
        <h2 className="font-display text-2xl font-extrabold text-primary">{t("chooseCompanion")}</h2>
        <p className="mt-1 text-muted-foreground">{t("companionHint")}</p>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {(["kabsoul", "kabsoula"] as Companion[]).map((c) => {
            const active = companion === c;
            return (
              <button
                key={c}
                onClick={() => set({ companion: c })}
                aria-pressed={active}
                className={cn("relative rounded-3xl border-2 bg-card p-3 pb-4 transition", active ? "border-primary shadow-float" : "border-border")}
              >
                {active && <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-5" /></span>}
                <div className={cn("rounded-2xl bg-sage", !active && "opacity-80")}>
                  <Mascot who={c} className="mx-auto h-40 w-auto" float={active} />
                </div>
                <p className="mt-3 font-display text-xl font-extrabold text-primary">{t(c)}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 shrink-0 text-success" /> {t("privacyNote")}
        </p>
        <Btn className="mt-6 w-full" onClick={() => { set({ onboarded: true }); go("home"); }}>{t("getStarted")}</Btn>
      </section>
    </div>
  );
}
