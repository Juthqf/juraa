import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Medication } from "../data";
import { formatTime } from "../i18n";
import { useApp } from "../store";
import { Btn, Card, TopBar } from "../ui";

const DEFAULT_TIMES: Record<1 | 2 | 3, string[]> = { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"] };

export function Meds() {
  const { t, meds, lang, removeMed } = useApp();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Medication | "new" | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const list = meds.filter((m) => [m.name, m.ingredient, m.nickname ?? ""].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pb-32">
      <TopBar
        title={t("meds")}
        right={<button onClick={() => setEditing("new")} aria-label={t("addMed")} className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-float"><Plus className="size-6" /></button>}
      />
      <div className="space-y-4 px-5">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4">
          <Search className="size-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full bg-transparent text-lg outline-none" />
        </label>
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">{t("noMeds")}</p>}
        {list.map((m) => (
          <Card key={m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-xl font-bold" dir="auto">{m.name}</p>
                {m.nickname && <p className="mt-1 break-words font-bold text-primary" dir="auto">{m.nickname}</p>}
                <p className="text-sm text-muted-foreground">{t("ingredient")}: <span dir="ltr">{m.ingredient}</span></p>
              </div>
              <span className="max-w-[40%] break-words rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground" dir="auto">{m.dose}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.strength && <span className="rounded-full bg-info-soft px-3 py-1 text-sm" dir="ltr">{m.strength}</span>}
              <span className="rounded-full bg-muted px-3 py-1 text-sm">{m.frequency} {t("timesDaily")}</span>
              {m.times.map((tm) => <span key={tm} className="rounded-full bg-muted px-3 py-1 text-sm" dir="ltr">{formatTime(tm, lang)}</span>)}
              {m.notes && <span className="rounded-full bg-warning-soft px-3 py-1 text-sm">{t(m.notes as "on_empty_stomach")}</span>}
            </div>
            {open === m.id && (
              <div className="mt-4 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                <Btn variant="outline" onClick={() => setEditing(m)}><Pencil className="size-5" />{t("edit")}</Btn>
                <Btn variant="outline" className="border-destructive/30 text-destructive" onClick={() => removeMed(m.id)}><Trash2 className="size-5" />{t("remove")}</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
      {editing && <MedForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function MedForm({ initial, onClose, prefill, onSaved }: { initial: Medication | null; onClose: () => void; prefill?: Partial<Medication>; onSaved?: () => void }) {
  const { t, upsertMed } = useApp();
  const [confirmed, setConfirmed] = useState(false);
  const [m, setM] = useState<Medication>(
    initial ?? { id: crypto.randomUUID(), name: "", ingredient: "", dose: "", frequency: 1, times: ["08:00"], ...prefill },
  );
  const field = "mt-1 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary";
  const updatePrescription = (patch: Partial<Medication>) => { setConfirmed(false); setM((value) => ({ ...value, ...patch })); };
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (!confirmed || !m.name.trim() || m.times.some((time) => !time)) return; upsertMed({ ...m, nickname: m.nickname?.trim() || undefined }); if (onSaved) { onSaved(); return; } if (!initial) toast.success(t("added")); onClose(); }}
        className="mx-auto max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold text-primary">{initial ? t("editMed") : t("addMed")}</h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-muted"><X className="size-5" /></button>
        </div>
        <label className="block font-bold">{t("name")}<input required dir="auto" className={field} value={m.name} onChange={(e) => updatePrescription({ name: e.target.value })} /></label>
        <label className="block font-bold">{t("medicationNickname")}<input dir="auto" maxLength={100} className={field} value={m.nickname ?? ""} onChange={(e) => setM({ ...m, nickname: e.target.value })} placeholder={t("medicationNicknamePlaceholder")} /></label>
        <p className="text-sm text-muted-foreground">{t("medicationNicknameHint")}</p>
        <label className="block font-bold">{t("ingredient")}<input dir="ltr" className={field} value={m.ingredient} onChange={(e) => updatePrescription({ ingredient: e.target.value })} /></label>
        <label className="block font-bold">{t("medicationStrength")}<input dir="auto" className={field} value={m.strength ?? ""} onChange={(e) => updatePrescription({ strength: e.target.value })} /></label>
        <label className="block font-bold">{t("prescribedDose")}<input dir="ltr" className={field} value={m.dose} onChange={(e) => updatePrescription({ dose: e.target.value })} placeholder="50 mg" /></label>
        <p className="text-sm text-muted-foreground">{t("strengthIsNotDose")}</p>
        <div>
          <p className="font-bold">{t("frequency")}</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((f) => (
              <Btn variant="ghost" type="button" key={f} onClick={() => updatePrescription({ frequency: f, times: DEFAULT_TIMES[f] })}
                className={cn("min-h-14 rounded-2xl border-2 text-lg font-bold", m.frequency === f ? "border-primary bg-secondary text-primary" : "border-border")}>{f}</Btn>
            ))}
          </div>
        </div>
        <div>
          <p className="font-bold">{t("times")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("reviewTimes")}</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {m.times.map((tm, i) => (
              <input key={i} required aria-label={`${t("times")} ${i + 1}`} type="time" value={tm} dir="ltr" className={`${field} min-w-0 px-2`}
                onChange={(e) => updatePrescription({ times: m.times.map((x, j) => (j === i ? e.target.value : x)) })} />
            ))}
          </div>
        </div>
        <label className="flex min-h-14 items-start gap-3"><input type="checkbox" className="mt-1 size-6 shrink-0 accent-primary" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />{t("confirmPrescription")}</label>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Btn type="button" variant="outline" onClick={onClose}>{t("cancel")}</Btn>
          <Btn type="submit" disabled={!confirmed || !m.name.trim() || m.times.some((time) => !time)}>{t("save")}</Btn>
        </div>
      </form>
    </div>
  );
}
