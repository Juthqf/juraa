import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp, useTodayDoses } from "@/app/store";
import { Home } from "@/app/screens/Home";
import { todayDoses, localDate, scheduledMinutes } from "@/app/dose-time";
import { formatTime } from "@/app/i18n";
import type { Medication } from "@/app/data";

const meds: Medication[] = [{ id: "time-med", name: "Schedule test", ingredient: "", dose: "", frequency: 2, times: ["08:00", "20:00"] }];
const at = (hour: number, minute = 0, day = 8) => new Date(2026, 10, day, hour, minute);
const read = () => JSON.parse(localStorage.getItem("kabsoul-demo-v1") ?? "{}");
function Harness() {
  const doses = useTodayDoses();
  const { toggleTaken } = useApp();
  return <><Home /><output data-testid="doses">{JSON.stringify(doses)}</output><button onClick={() => toggleTaken("time-med", "20:00")}>toggle evening</button></>;
}
function start(now: Date, taken = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  localStorage.setItem("kabsoul-demo-v1", JSON.stringify({ onboarded: true, meds, taken }));
  render(<AppProvider><Harness /></AppProvider>);
}
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

describe("Home device-local scheduling", () => {
  it("keeps past unconfirmed doses and selects only a strictly future dose", () => {
    const doses = todayDoses(meds, {}, at(8, 30));
    expect(doses.map((d) => d.status)).toEqual(["missed", "upcoming"]);
    start(at(8, 30));
    expect(screen.getByText("8:00 م")).toBeInTheDocument();
    expect(screen.getAllByText("فاتت")).toHaveLength(1);
  });
  it("changes status exactly at the scheduled minute, without a grace hour", () => {
    expect(todayDoses(meds, {}, at(7, 59))[0]?.status).toBe("upcoming");
    expect(todayDoses(meds, {}, at(8))[0]?.status).toBe("missed");
  });
  it.each([["00:00", "12:00 ص"], ["08:05", "8:05 ص"], ["12:00", "12:00 م"], ["20:00", "8:00 م"]])("formats %s with correct Arabic AM/PM", (time, expected) => {
    expect(formatTime(time, "ar")).toBe(expected);
  });
  it("parses 24-hour times and ignores malformed schedules rather than treating them as midnight", () => {
    expect(scheduledMinutes("20:15")).toBe(1215);
    expect(scheduledMinutes("24:00")).toBeNull();
    expect(scheduledMinutes("8:00 PM")).toBeNull();
  });
  it("automatically updates when time passes", () => {
    start(new Date(2026, 10, 8, 19, 59, 59));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("لا توجد جرعات قادمة اليوم")).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("doses").textContent ?? "[]")[1].status).toBe("missed");
  });
  it.each(["visibilitychange", "focus", "pageshow"])("refreshes immediately on %s after backgrounding", (event) => {
    start(at(19));
    vi.setSystemTime(at(21));
    act(() => (event === "visibilitychange" ? document : window).dispatchEvent(new Event(event)));
    expect(screen.getByText("لا توجد جرعات قادمة اليوم")).toBeInTheDocument();
  });
  it("rolls into the next local day and retains every historical confirmation", () => {
    const taken = { "2026-11-08|time-med|20:00": true, "2025-01-01|time-med|08:00": true };
    start(new Date(2026, 10, 8, 23, 59, 59), taken);
    act(() => vi.advanceTimersByTime(1000));
    expect(JSON.parse(screen.getByTestId("doses").textContent ?? "[]").map((d: { status: string }) => d.status)).toEqual(["upcoming", "upcoming"]);
    expect(read().taken).toEqual(taken);
    expect(localDate(new Date(2026, 10, 9, 0, 5))).toBe("2026-11-09");
  });
  it("keeps the existing one-click confirmation and undo without changing schedules or old records", () => {
    const taken = { "2025-01-01|time-med|08:00": true };
    start(at(19), taken);
    fireEvent.click(screen.getByRole("button", { name: "تناولت الدواء" }));
    expect(read().taken).toEqual({ ...taken, "2026-11-08|time-med|20:00": true });
    expect(read().meds).toEqual(meds);
    fireEvent.click(screen.getByRole("button", { name: "toggle evening" }));
    expect(read().taken).toEqual(taken);
  });
});