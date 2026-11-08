import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/app/store";
import { KabsoulApp } from "@/app/App";
import { LaunchWelcome } from "@/app/WelcomeSplash";

const KEY = "kabsoul-demo-v1";
const welcome = () => screen.getByRole("button", { name: /تخطي الترحيب/ });
const read = () => JSON.parse(localStorage.getItem(KEY) ?? "{}");
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

describe("Launch-only welcome", () => {
  it("shows onboarding for a new user after exactly 3000ms, never earlier", () => {
    vi.useFakeTimers();
    render(<KabsoulApp />);
    expect(read().onboarded).toBe(false);
    act(() => { vi.advanceTimersByTime(2999); });
    expect(welcome()).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByRole("button", { name: /تخطي الترحيب/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ابدأ الآن" })).toBeInTheDocument();
    expect(read().onboarded).toBe(false);
  });

  it("lets returning users skip immediately to home without replaying during navigation", () => {
    localStorage.setItem(KEY, JSON.stringify({ onboarded: true }));
    render(<KabsoulApp />);
    fireEvent.click(welcome());
    expect(screen.getByRole("button", { name: "عرض الجدول" })).toBeInTheDocument();
    for (const name of ["أدويتي", "التغذية", "حسابي", "الرئيسية"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.queryByRole("button", { name: /تخطي الترحيب/ })).not.toBeInTheDocument();
    }
  });

  it("shows home after the timeout for completed onboarding", () => {
    vi.useFakeTimers();
    localStorage.setItem(KEY, JSON.stringify({ onboarded: true }));
    render(<KabsoulApp />);
    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.getByRole("button", { name: "عرض الجدول" })).toBeInTheDocument();
  });

  it("allows new users to skip immediately into existing onboarding", () => {
    render(<KabsoulApp />);
    fireEvent.click(welcome());
    expect(screen.getByRole("button", { name: "ابدأ الآن" })).toBeInTheDocument();
  });

  it("never displays the destination until profile hydration finishes, even after skip", () => {
    const view = render(<AppProvider><LaunchWelcome ready={false}><output>destination</output></LaunchWelcome></AppProvider>);
    fireEvent.click(welcome());
    expect(screen.queryByText("destination")).not.toBeInTheDocument();
    view.rerender(<AppProvider><LaunchWelcome ready><output>destination</output></LaunchWelcome></AppProvider>);
    expect(screen.getByText("destination")).toBeInTheDocument();
  });

  it("shows again on reload without changing any saved data", () => {
    localStorage.setItem(KEY, JSON.stringify({ onboarded: true, nickname: "محفوظ", companion: "kabsoula", chronicConditions: { other: true, otherText: "محفوظ", selected: ["conditionDiabetes"] }, meds: [{ id: "mine", name: "Saved medicine", ingredient: "", dose: "1", times: ["09:00"], nickname: "لقب" }], taken: { "2026-11-08|mine|09:00": true }, notifPref: "inapp" }));
    const first = render(<KabsoulApp />);
    const before = read();
    fireEvent.click(welcome());
    first.unmount();
    render(<KabsoulApp />);
    expect(welcome()).toBeInTheDocument();
    fireEvent.click(welcome());
    expect(read()).toEqual(before);
    expect(screen.getByRole("button", { name: "عرض الجدول" })).toBeInTheDocument();
  });
});