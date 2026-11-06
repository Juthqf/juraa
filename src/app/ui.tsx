import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Camera, Home, MessageCircle, Pill, User } from "lucide-react";
import { cn } from "@/lib/utils";
import kabsoulImg from "@/assets/kabsoul.png";
import kabsoulaImg from "@/assets/kabsoula.png";
import { useApp, type Companion, type Screen } from "./store";

export const MASCOTS: Record<Companion, string> = { kabsoul: kabsoulImg, kabsoula: kabsoulaImg };

export function Mascot({ who, className, float }: { who?: Companion; className?: string; float?: boolean }) {
  const { companion, t } = useApp();
  const c = who ?? companion;
  return (
    <img
      src={MASCOTS[c]}
      alt={t(c)}
      width={1024}
      height={1024}
      className={cn("object-contain select-none drop-shadow-xl", float && "float-soft", className)}
      draggable={false}
    />
  );
}

type BtnVariant = "primary" | "outline" | "soft" | "gold" | "ghost";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-float hover:bg-primary/90",
  outline: "border-2 border-primary/25 bg-card text-primary hover:bg-muted",
  soft: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  gold: "bg-accent text-accent-foreground hover:bg-accent/90",
  ghost: "text-primary hover:bg-muted",
};
export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-lg font-bold transition active:scale-[0.98] disabled:opacity-50",
        btnStyles[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const Cmp = onClick ? "button" : "div";
  return (
    <Cmp onClick={onClick} className={cn("block w-full rounded-3xl border border-border bg-card p-5 text-start shadow-soft", onClick && "transition active:scale-[0.99]", className)}>
      {children}
    </Cmp>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, set } = useApp();
  return (
    <button
      onClick={() => set({ lang: lang === "ar" ? "en" : "ar" })}
      className={cn("min-h-11 rounded-full border border-border bg-card px-4 text-sm font-bold text-primary", className)}
      aria-label="Toggle language"
    >
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}

export function TopBar({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: boolean; right?: ReactNode }) {
  const { back, lang, t } = useApp();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  return (
    <header className="flex items-center gap-3 px-5 pb-3 pt-6">
      {onBack && (
        <button onClick={back} aria-label={t("back")} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary">
          <BackIcon className="size-6" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-extrabold text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function StatusPill({ status }: { status: "taken" | "upcoming" | "missed" }) {
  const { t } = useApp();
  const s = { taken: "bg-success-soft text-success", upcoming: "bg-warning-soft text-accent-foreground", missed: "bg-danger-soft text-destructive" }[status];
  return <span className={cn("rounded-full px-3 py-1 text-sm font-bold", s)}>{t(status)}</span>;
}

export function DemoBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-xs font-bold text-accent-foreground">{children}</span>;
}

const TABS: { s: Screen; icon: typeof Home; k: "home" | "meds" | "scan" | "chat" | "profile" }[] = [
  { s: "home", icon: Home, k: "home" },
  { s: "meds", icon: Pill, k: "meds" },
  { s: "scan", icon: Camera, k: "scan" },
  { s: "chat", icon: MessageCircle, k: "chat" },
  { s: "profile", icon: User, k: "profile" },
];

export function BottomNav() {
  const { screen, go, t } = useApp();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-4">
      <div className="flex items-end justify-between rounded-3xl border border-border bg-card px-2 py-2 shadow-float">
        {TABS.map(({ s, icon: Icon, k }) =>
          s === "scan" ? (
            <button key={s} onClick={() => go(s)} aria-label={t(k)} className="-mt-8 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-float ring-4 ring-background">
              <Icon className="size-7" />
            </button>
          ) : (
            <button
              key={s}
              onClick={() => go(s)}
              className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold", screen === s ? "text-primary" : "text-muted-foreground")}
            >
              <Icon className={cn("size-6", screen === s && "fill-secondary")} />
              {t(k)}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
