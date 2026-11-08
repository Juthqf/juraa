import { useId } from "react";
import { useApp } from "./store";

export type ConditionDetails = { other: boolean; otherText: string };

export function ConditionFields({ value, onChange }: { value?: ConditionDetails; onChange: (value: ConditionDetails) => void }) {
  const { t } = useApp();
  const id = useId();
  const conditions = value ?? { other: false, otherText: "" };
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="font-bold text-primary">{t("chronicConditions")}</legend>
      <label className="flex min-h-14 items-center gap-3">
        <input type="checkbox" className="size-6 accent-primary" checked={conditions.other} onChange={(e) => onChange({ other: e.target.checked, otherText: e.target.checked ? conditions.otherText : "" })} />
        {t("otherCondition")}
      </label>
      {conditions.other && <label className="block font-bold" htmlFor={id}>
        {t("otherConditionText")}
        <input id={id} dir="auto" maxLength={200} value={conditions.otherText} onChange={(e) => onChange({ ...conditions, otherText: e.target.value })} className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary" />
      </label>}
    </fieldset>
  );
}