import { useId } from "react";
import { useApp } from "./store";

export type ConditionDetails = { other: boolean; otherText: string; selected?: string[] };

const OPTIONS = ["conditionDiabetes", "conditionHypertension", "conditionHeart", "conditionAsthma", "conditionCopd", "conditionKidney", "conditionThyroid"] as const;

export function ConditionFields({ value, onChange }: { value?: ConditionDetails | undefined; onChange: (value: ConditionDetails) => void }) {
  const { t } = useApp();
  const id = useId();
  const conditions = value ?? { other: false, otherText: "" };
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="font-bold text-primary">{t("chronicConditions")}</legend>
      {OPTIONS.map((option) => <label key={option} className="flex min-h-14 items-center gap-3">
        <input type="checkbox" className="size-6 shrink-0 accent-primary" checked={conditions.selected?.includes(option) ?? false} onChange={(e) => {
          const selected = conditions.selected ?? [];
          onChange({ ...conditions, selected: e.target.checked ? [...selected, option] : selected.filter((item) => item !== option) });
        }} />
        <span className="min-w-0">{t(option)}</span>
      </label>)}
      <label className="flex min-h-14 items-center gap-3">
        <input type="checkbox" className="size-6 shrink-0 accent-primary" checked={conditions.other} onChange={(e) => onChange({ ...conditions, other: e.target.checked, otherText: e.target.checked ? conditions.otherText : "" })} />
        {t("otherCondition")}
      </label>
      {conditions.other && <label className="block font-bold" htmlFor={id}>
        {t("otherConditionText")}
        <input id={id} dir="auto" maxLength={200} value={conditions.otherText} onChange={(e) => onChange({ ...conditions, otherText: e.target.value })} className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary" />
      </label>}
    </fieldset>
  );
}