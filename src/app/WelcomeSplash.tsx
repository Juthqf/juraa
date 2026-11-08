import { useEffect, useState, type ReactNode } from "react";
import { Btn, Mascot } from "./ui";

export const WELCOME_DURATION_MS = 3000;

/** One-shot entrance: mascots first, then name, slogan, and closing line. */
const RISE_MASCOTS = 0;
const RISE_NAME = 150;
const RISE_SLOGAN = 350;
const RISE_CLOSING = 550;
const rise = (delay: number) => ({ className: "welcome-rise", style: { animationDelay: `${delay}ms` } });

/** Mount once per app launch; never changes the persisted screen or profile. */
export function LaunchWelcome({ ready, children }: { ready: boolean; children: ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDismissed(true), WELCOME_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!dismissed || !ready) return (
    <Btn
      variant="ghost"
      onClick={() => setDismissed(true)}
      aria-label="جرعة — معك في كل جرعة — رفيقك لتنظيم أدويتك، خطوة بخطوة. — تخطي الترحيب"
      dir="rtl"
      className="fixed inset-0 z-50 block h-full w-full overflow-y-auto rounded-none bg-background px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] font-normal transition-none hover:bg-background active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-ring"
    >
      <span className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-6">
        <span className="font-display text-5xl font-extrabold text-primary">جرعة</span>
        <span className="text-2xl font-bold text-primary">معك في كل جرعة</span>
        <span className="grid w-full grid-cols-2 items-end gap-2" aria-hidden="true">
          <Mascot who="kabsoul" className="h-44 w-full sm:h-52" />
          <Mascot who="kabsoula" className="h-44 w-full sm:h-52" />
        </span>
        <span className="h-1 w-12 rounded-full bg-secondary" aria-hidden="true" />
        <span className="text-lg leading-relaxed text-muted-foreground">رفيقك لتنظيم أدويتك، خطوة بخطوة.</span>
      </span>
    </Btn>
  );
  return children;
}