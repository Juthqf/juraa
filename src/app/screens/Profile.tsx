import { BellOff, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, type Companion } from "../store";
import { Btn, Card, Mascot, TopBar } from "../ui";
import { ConditionFields } from "../ConditionFields";

export function Profile() {
  const { t, lang, set, companion, nickname, textScale, notifPref, chronicConditions } = useApp();
  const seg = (active: boolean) => cn("min-h-14 flex-1 rounded-2xl border-2 font-bold", active ? "border-primary bg-secondary text-primary" : "border-border bg-card");
  return (
    <div className="pb-32">
      <TopBar title={t("settings")} />
      <div className="space-y-4 px-5">
        <Card><ConditionFields value={chronicConditions} onChange={(value) => set({ chronicConditions: value })} /></Card>
        <Card>
          <label className="mb-3 block font-bold text-primary" htmlFor="settings-nickname">{t("nickname")}</label>
          <input
            id="settings-nickname"
            value={nickname}
            onChange={(e) => set({ nickname: e.target.value.slice(0, 30) })}
            placeholder={t("nicknamePlaceholder")}
            className="min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary"
          />
        </Card>
        <Card>
          <p className="mb-3 font-bold text-primary">{t("language")}</p>
          <div className="flex gap-3">
            <button className={seg(lang === "ar")} onClick={() => set({ lang: "ar" })}>العربية</button>
            <button className={seg(lang === "en")} onClick={() => set({ lang: "en" })}>English</button>
          </div>
        </Card>
        <Card>
          <p className="mb-3 font-bold text-primary">{t("companion")}</p>
          <div className="grid grid-cols-2 gap-3">
            {(["kabsoul", "kabsoula"] as Companion[]).map((c) => (
              <button key={c} onClick={() => set({ companion: c })} className={cn(seg(companion === c), "flex flex-col items-center py-3")}>
                <Mascot who={c} className="h-24 w-auto" />
                {t(c)}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-3 font-bold text-primary">{t("textSize")}</p>
          <div className="flex gap-3">
            {[1, 1.15, 1.3].map((s, i) => (
              <button key={s} className={seg(textScale === s)} onClick={() => set({ textScale: s })} style={{ fontSize: `${14 + i * 4}px` }}>أ A</button>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-3 flex items-center gap-2 font-bold text-primary"><BellOff className="size-5" />{t("notifStatus")}</p>
          <p className="text-sm text-muted-foreground">{notifPref === "inapp" ? t("notifStatusInApp") : t("notifStatusOff")}</p>
          <Btn
            variant="outline"
            className="mt-3 w-full"
            onClick={() => set({ notifPref: notifPref === "inapp" ? "later" : "inapp" })}
          >
            {notifPref === "inapp" ? t("disableInApp") : t("enableInApp")}
          </Btn>
        </Card>
        <Card className="bg-sage">
          <p className="flex items-center gap-2 font-bold text-primary"><Info className="size-5" />{t("about")}</p>
          <p className="mt-2 text-sm">{t("aboutText")}</p>
        </Card>
      </div>
    </div>
  );
}
