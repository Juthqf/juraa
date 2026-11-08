import { useEffect, useState } from "react";

/** Refresh visible schedules on passage of time and immediately on resume. */
export function useDeviceTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    update();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);
  return now;
}