import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SEED_MEDS, type Medication } from "./data";
import { translate, type Lang, type TKey } from "./i18n";

export type Companion = "kabsoul" | "kabsoula";
export type Screen =
  | "onboarding" | "personalize" | "notifySetup" | "home" | "meds" | "schedule" | "scan" | "identify" | "safety" | "saved" | "chat" | "profile" | "nutrition";

/** What the user chose on the notification setup screen. No push infrastructure
 * exists yet, so this only records an in-app preference — never a real subscription. */
export type NotifPref = "inapp" | "later";

export type Candidate = { name: string; ingredient: string; dose: string; genericName?: string; dosageForm?: string; source?: "vision" | "manual"; uncertainty?: string };

type Persisted = {
  onboarded: boolean;
  lang: Lang;
  companion: Companion;
  nickname: string;
  textScale: number;
  notifPref: NotifPref | null;
  meds: Medication[];
  taken: Record<string, boolean>; // `${date}|${medId}|${time}`
};

const KEY = "kabsoul-demo-v1";
const DEFAULTS: Persisted = { onboarded: false, lang: "ar", companion: "kabsoul", nickname: "", textScale: 1, notifPref: null, meds: SEED_MEDS, taken: {} };

export const today = () => new Date().toISOString().slice(0, 10);
export const doseKey = (medId: string, time: string) => `${today()}|${medId}|${time}`;

type Ctx = Persisted & {
  hydrated: boolean;
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  t: (k: TKey) => string;
  set: (p: Partial<Persisted>) => void;
  toggleTaken: (medId: string, time: string) => void;
  upsertMed: (m: Medication) => void;
  removeMed: (id: string) => void;
  candidate: Candidate | null;
  setCandidate: (c: Candidate | null) => void;
  reset: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<Screen[]>(["onboarding"]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = { ...DEFAULTS, ...JSON.parse(raw) } as Persisted;
        setState(p);
        if (p.onboarded) setHistory(["home"]);
      }
    } catch { /* ignore corrupt storage */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.documentElement.style.setProperty("--text-scale", String(state.textScale));
  }, [state, hydrated]);

  const set = useCallback((p: Partial<Persisted>) => setState((s) => ({ ...s, ...p })), []);
  const go = useCallback((s: Screen) => {
    setHistory((h) => (h[h.length - 1] === s ? h : [...h, s]));
    window.scrollTo({ top: 0 });
  }, []);
  const back = useCallback(() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : ["home"])), []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    hydrated,
    screen: history[history.length - 1] ?? "home",
    go,
    back,
    t: (k) => translate(state.lang, k),
    set,
    toggleTaken: (id, time) =>
      setState((s) => {
        const k = doseKey(id, time);
        const taken = { ...s.taken };
        if (taken[k]) delete taken[k]; else taken[k] = true;
        return { ...s, taken };
      }),
    upsertMed: (m) =>
      setState((s) => ({
        ...s,
        meds: s.meds.some((x) => x.id === m.id) ? s.meds.map((x) => (x.id === m.id ? m : x)) : [...s.meds, m],
      })),
    removeMed: (id) => setState((s) => ({ ...s, meds: s.meds.filter((m) => m.id !== id) })),
    candidate,
    setCandidate,
    reset: () => { setState({ ...DEFAULTS }); setHistory(["onboarding"]); },
  }), [state, hydrated, history, go, back, set, candidate]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

/** Flattened list of today's doses sorted by time. */
export function useTodayDoses() {
  const { meds, taken } = useApp();
  return useMemo(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return meds
      .flatMap((m) => m.times.map((time) => {
        const [h = 0, mm = 0] = time.split(":").map(Number);
        const isTaken = !!taken[doseKey(m.id, time)];
        const status: "taken" | "missed" | "upcoming" = isTaken ? "taken" : h * 60 + mm < nowMin - 60 ? "missed" : "upcoming";
        return { med: m, time, status, minutes: h * 60 + mm };
      }))
      .sort((a, b) => a.minutes - b.minutes);
  }, [meds, taken]);
}
