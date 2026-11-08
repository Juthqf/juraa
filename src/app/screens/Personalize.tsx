import { useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "../store";
import { Btn, Card, Mascot } from "../ui";
import { ConditionFields } from "../ConditionFields";

export function Personalize() {
  const { t, set, go, back, nickname, textScale, chronicConditions } = useApp();
  const [conditions, setConditions] = useState(chronicConditions ?? { other: false, otherText: "" });
  const [name, setName] = useState(nickname);
  const [scale, setScale] = useState(textScale >= 1.3 ? 1.3 : 1);

  const save = () => {
    set({ nickname: name.trim(), textScale: scale, chronicConditions: conditions });
    go("notifySetup");
  };

  return (
    <div className="min-h-screen px-6 pb-10 pt-8">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-sage">
          <Mascot className="h-20 w-auto" float />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-primary">{t("personalizeTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("personalizeSub")}</p>
        </div>
      </div>

      <Card className="mt-8">
        <label className="block font-bold text-primary" htmlFor="nickname">
          {t("nicknameLabel")} <span className="text-sm font-normal text-muted-foreground">({t("optional")})</span>
        </label>
        <input
          id="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          maxLength={30}
          className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary"
        />
      </Card>

      <Card className="mt-4">
        <p className="font-bold text-primary">{t("textSizeLabel")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {([1, 1.3] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scale === s}
              onClick={() => setScale(s)}
              className={cn("min-h-14 rounded-2xl border-2 font-bold", scale === s ? "border-primary bg-secondary text-primary" : "border-border bg-card")}
            >
              {s === 1 ? t("textNormal") : t("textLarge")}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-muted p-4 text-muted-foreground" style={{ fontSize: `${scale}em` }}>
          {t("textPreview")}
        </p>
      </Card>

      <Card className="mt-4"><ConditionFields value={conditions} onChange={setConditions} /></Card>

      <div className="mt-8 space-y-3">
        <Btn className="w-full" onClick={save}>{t("next")}</Btn>
        <Btn variant="outline" className="w-full" onClick={() => { set({ nickname: "", textScale: 1 }); go("notifySetup"); }}>{t("skipNow")}</Btn>
        <Btn variant="ghost" className="w-full" onClick={back}>{t("back")}</Btn>
      </div>
    </div>
  );
}
