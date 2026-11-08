import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Quote, Search, ShieldQuestion, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES, foodsByCategory, searchFoods, type CategoryId, type Food } from "../nutrition";
import { useApp } from "../store";
import { Btn, Card, TopBar } from "../ui";

type View = { kind: "home" } | { kind: "category"; id: CategoryId } | { kind: "detail"; food: Food };

export function Nutrition() {
  const { t, lang, go } = useApp();
  const [view, setView] = useState<View>({ kind: "home" });
  const [q, setQ] = useState("");
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const Chev = lang === "ar" ? ChevronLeft : ChevronRight;

  const back = () => setView((v) => (v.kind === "detail" ? { kind: "category", id: v.food.categories[0] ?? "sunnah" } : { kind: "home" }));

  const subHeader = (title: string) => (
    <div className="flex items-center gap-3 px-5 pb-3 pt-6">
      <button onClick={back} aria-label={t("back")} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary">
        <BackIcon className="size-6" />
      </button>
      <h1 className="font-display text-2xl font-extrabold text-primary">{title}</h1>
    </div>
  );

  const foodCard = (f: Food) => (
    <Card key={f.id} onClick={() => setView({ kind: "detail", food: f })} className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-sage text-3xl" aria-hidden>{f.emoji}</span>
        <p className="text-lg font-bold text-primary">{f.name[lang]}</p>
      </div>
      <Chev className="size-5 text-muted-foreground" />
    </Card>
  );

  if (view.kind === "detail") {
    const f = view.food;
    const sections: { icon: typeof BookOpen; title: string; body: string[] }[] = [
      { icon: BookOpen, title: t("foodAbout"), body: [f.about[lang]] },
      { icon: Sparkles, title: t("foodNutrients"), body: f.nutrients.map((n) => n[lang]) },
      { icon: Sparkles, title: t("foodBenefits"), body: f.benefits.map((b) => b[lang]) },
      { icon: Quote, title: t("foodTip"), body: [f.tip[lang]] },
    ];
    return (
      <div className="pb-32">
        {subHeader(f.name[lang])}
        <div className="space-y-4 px-5">
          <div className="grid place-items-center rounded-3xl bg-sage py-8">
            <span className="text-7xl" role="img" aria-label={f.name[lang]}>{f.emoji}</span>
          </div>
          {sections.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <p className="mb-2 flex items-center gap-2 font-bold text-primary"><Icon className="size-5" />{title}</p>
              {body.length === 1 ? (
                <p>{body[0]}</p>
              ) : (
                <ul className="list-disc space-y-1 ps-5">
                  {body.map((line) => <li key={line}>{line}</li>)}
                </ul>
              )}
            </Card>
          ))}
          {f.sunnah && (
            <Card className="bg-sage">
              <p className="mb-2 flex items-center gap-2 font-bold text-primary"><Quote className="size-5" />{t("foodSunnah")}</p>
              <p>{f.sunnah[lang]}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("sunnahNote")}</p>
            </Card>
          )}
          <Card>
            <p className="mb-2 flex items-center gap-2 font-bold text-primary"><BookOpen className="size-5" />{t("foodSources")}</p>
            <ul className="list-disc space-y-1 ps-5 text-sm">
              {f.sources.map((s) => <li key={s.en}>{s[lang]}</li>)}
            </ul>
          </Card>
          <Card className="border-primary/25">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldQuestion className="mt-0.5 size-5 shrink-0 text-primary" />
              {t("checkFoodNote")}
            </p>
            <Btn variant="outline" className="mt-3 w-full" onClick={() => go("safety")}>{t("checkFoodWithMeds")}</Btn>
          </Card>
          <p className="text-center text-xs text-muted-foreground">{t("nutritionEducation")}</p>
        </div>
      </div>
    );
  }

  if (view.kind === "category") {
    const cat = CATEGORIES.find((c) => c.id === view.id)!;
    return (
      <div className="pb-32">
        {subHeader(t(`cat_${cat.id}` as const))}
        <div className="space-y-3 px-5">
          {foodsByCategory(cat.id).map(foodCard)}
        </div>
      </div>
    );
  }

  const results = searchFoods(q, lang);
  return (
    <div className="pb-32">
      <TopBar title={t("nutritionTitle")} subtitle={t("nutritionSub")} />
      <div className="space-y-4 px-5">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4">
          <Search className="size-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nutritionSearch")} className="w-full bg-transparent text-lg outline-none" />
        </label>

        {q.trim() ? (
          <div className="space-y-3">
            {results.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noFoods")}</p>}
            {results.map(foodCard)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((c) => (
              <Card key={c.id} onClick={() => setView({ kind: "category", id: c.id })} className={cn("text-center")}>
                <span className="grid mx-auto size-16 place-items-center rounded-2xl bg-sage text-4xl" aria-hidden>{c.emoji}</span>
                <p className="mt-3 font-bold text-primary">{t(`cat_${c.id}` as const)}</p>
                <p className="text-xs text-muted-foreground">{foodsByCategory(c.id).length}</p>
              </Card>
            ))}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">{t("nutritionEducation")}</p>
      </div>
    </div>
  );
}
