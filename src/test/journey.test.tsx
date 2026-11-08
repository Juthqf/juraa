import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { bucketWeekly, computeJourney, type DayPoint } from "@/app/journey";
import type { Medication } from "@/app/data";
import { AppProvider, today } from "@/app/store";
import { Home } from "@/app/screens/Home";
import { Journey } from "@/app/screens/Journey";

// Local Nov 8 2026, 15:00 — UTC date stays Nov 8 for any offset under 15h.
const NOW = new Date(2026, 10, 8, 15, 0, 0);

const MEDS: Medication[] = [
  { id: "a", name: "A", ingredient: "a", dose: "1", frequency: 2, times: ["08:00", "20:00"] },
  { id: "b", name: "B", ingredient: "b", dose: "1", frequency: 1, times: ["07:00"] },
];

const TAKEN = {
  "2026-11-08|a|08:00": true,
  "2026-11-07|a|08:00": true,
  "2026-11-07|a|20:00": true,
  "2026-11-07|b|07:00": true,
};

describe("computeJourney", () => {
  it("calculates today's adherence from confirmed doses over due scheduled doses", () => {
    const s = computeJourney(MEDS, TAKEN, "today", NOW);
    expect(s.eligible).toBe(2); // a 08:00 + b 07:00; a 20:00 is still in the future
    expect(s.taken).toBe(1);
    expect(s.unconfirmed).toBe(1);
    expect(s.adherence).toBe(50);
  });

  it("calculates the weekly view over seven days", () => {
    const s = computeJourney(MEDS, TAKEN, "week", NOW);
    expect(s.eligible).toBe(20); // 7 days × 3 doses − today's future 20:00
    expect(s.taken).toBe(4);
    expect(s.unconfirmed).toBe(16);
    expect(s.adherence).toBe(20);
    expect(s.since).toBe("2026-11-07");
  });

  it("counts consecutive fully recorded days without letting an in-progress today break the run", () => {
    const s = computeJourney(MEDS, TAKEN, "week", NOW);
    expect(s.streak).toBe(1); // Nov 7 fully recorded; Nov 6 empty breaks the run
    const full = computeJourney(MEDS, { ...TAKEN, "2026-11-08|b|07:00": true }, "week", NOW);
    expect(full.streak).toBe(1); // today still incomplete (20:00 pending), Nov 7 full
  });

  it("returns honest unavailable states when there is no history", () => {
    const s = computeJourney([], {}, "week", NOW);
    expect(s.adherence).toBeNull();
    expect(s.since).toBeNull();
    expect(s.streak).toBeNull();
    expect(s.hasHistory).toBe(false);
    expect(s.eligible).toBe(0);
  });

  it("ignores records for removed medications and times no longer scheduled", () => {
    const s = computeJourney(MEDS, { "2026-11-07|ghost|09:00": true, "2026-11-07|a|09:30": true }, "week", NOW);
    expect(s.taken).toBe(0);
    expect(s.eligible).toBe(20);
    expect(s.hasHistory).toBe(true); // records exist, but none match the current schedule
  });

  it("computes past eligibility from the current schedule after a schedule change", () => {
    const changed: Medication[] = [{ ...MEDS[0], times: ["08:00"] }, MEDS[1]];
    const s = computeJourney(changed, { "2026-11-07|a|20:00": true }, "week", NOW);
    expect(s.eligible).toBe(13); // 7 × 2 − today's future... a 08:00 + b 07:00 today both past
    expect(s.taken).toBe(0); // the 20:00 dose is no longer in the schedule
  });

  it("starts the all-time view at the earliest confirmed record", () => {
    const s = computeJourney(MEDS, { "2026-10-20|a|08:00": true }, "all", NOW);
    expect(s.days[0].date).toBe("2026-10-20");
    expect(s.since).toBe("2026-10-20");
    expect(s.taken).toBe(1);
  });

  it("buckets long series into weeks for the chart", () => {
    const days: DayPoint[] = Array.from({ length: 40 }, (_, i) => ({ date: `d${i}`, taken: 1, eligible: 2 }));
    const weeks = bucketWeekly(days);
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual({ date: "d0", taken: 7, eligible: 14 });
    expect(bucketWeekly(days.slice(0, 10))).toHaveLength(10);
  });
});

const KEY = "kabsoul-demo-v1";
const read = () => JSON.parse(localStorage.getItem(KEY) ?? "{}");
afterEach(() => { cleanup(); localStorage.clear(); });

async function start(child: React.ReactNode, saved = {}) {
  localStorage.setItem(KEY, JSON.stringify({ onboarded: true, ...saved }));
  const result = render(<AppProvider>{child}</AppProvider>);
  await waitFor(() => expect(read().meds).toBeDefined());
  return result;
}

describe("Treatment journey screen", () => {
  it("opens from the Home card and shows the dashboard with range filters", async () => {
    await start(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /رحلتي العلاجية/ }));
    const journey = await start(<Journey />);
    expect(screen.getByRole("heading", { name: "رحلتي العلاجية" })).toBeInTheDocument();
    for (const label of ["اليوم", "أسبوع", "شهر", "الكل"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    journey.unmount();
  });

  it("shows an honest empty state when there is no medication history", async () => {
    await start(<Journey />, { meds: [], taken: {} });
    expect(screen.getByText(/لا توجد سجلات بعد/)).toBeInTheDocument();
    expect(screen.getByText("بانتظار تفعيل البيانات الطبية المعتمدة")).toBeInTheDocument();
  });

  it("shows real adherence from saved records and marks skipped doses as unavailable", async () => {
    const med: Medication = { id: "x", name: "X", ingredient: "x", dose: "1", frequency: 1, times: ["00:00"] };
    await start(<Journey />, { meds: [med], taken: { [`${today()}|x|00:00`]: true } });
    fireEvent.click(screen.getByRole("button", { name: "اليوم" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("جرعات متخطّاة")).toBeInTheDocument();
    expect(screen.getAllByText("غير متوفر").length).toBeGreaterThan(0);
  });
});
