import type { DbRecord } from "./safety";
import { useApp } from "./store";

/** Shows one imported workbook record verbatim, always labelled as not clinically verified. */
export function RecordCard({ r }: { r: DbRecord }) {
  const { t } = useApp();
  const row = (k: Parameters<typeof t>[0], v: string | null, ltr = false) =>
    v ? <div><dt className="inline font-bold">{t(k)}: </dt><dd className="inline break-words" dir={ltr ? "ltr" : "rtl"}>{v}</dd></div> : null;
  return (
    <dl className="mt-3 space-y-1 rounded-2xl bg-card/60 p-3 text-sm">
      {row("actionLevel", r.action_level_ar)}
      {row("reason", r.interaction_description)}
      {row("recommendation", r.recommendation)}
      {row("timingGap", r.gap_text_ar)}
      {row("reference", r.reference_text, true)}
      {row("evidenceStatus", r.evidence_status_ar)}
      {row("pharmacistReviewed", r.pharmacist_reviewed_ar)}
    </dl>
  );
}
