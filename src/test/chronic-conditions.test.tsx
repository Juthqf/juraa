import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/app/store";
import { Profile } from "@/app/screens/Profile";
import { Personalize } from "@/app/screens/Personalize";
import { SEED_MEDS } from "@/app/data";

const KEY = "kabsoul-demo-v1";
const read = () => JSON.parse(localStorage.getItem(KEY) ?? "{}");
const choices = [
  ["السكري", "conditionDiabetes"],
  ["ارتفاع ضغط الدم", "conditionHypertension"],
  ["أمراض القلب", "conditionHeart"],
  ["الربو", "conditionAsthma"],
  ["الانسداد الرئوي المزمن (COPD)", "conditionCopd"],
  ["أمراض الكلى المزمنة", "conditionKidney"],
  ["أمراض الغدة الدرقية", "conditionThyroid"],
] as const;
const toggle = (name: string) => fireEvent.click(screen.getByRole("checkbox", { name }));

afterEach(() => { cleanup(); localStorage.clear(); });

async function start(child: React.ReactNode, saved = {}) {
  localStorage.setItem(KEY, JSON.stringify({ onboarded: true, ...saved }));
  const result = render(<AppProvider>{child}</AppProvider>);
  await waitFor(() => expect(read().meds).toBeDefined());
  return result;
}

describe("Optional self-reported chronic conditions", () => {
  it.each(choices)("allows selecting and removing %s", async (label, key) => {
    await start(<Profile />);
    toggle(label);
    expect(read().chronicConditions.selected).toEqual([key]);
    toggle(label);
    expect(read().chronicConditions.selected).toEqual([]);
  });

  it("allows continuing with no conditions selected", async () => {
    await start(<Personalize />);
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(read().chronicConditions).toEqual({ other: false, otherText: "" });
  });

  it("saves multiple onboarding choices and permits profile additions and removal after reload", async () => {
    const first = await start(<Personalize />);
    toggle("السكري");
    toggle("ارتفاع ضغط الدم");
    toggle("غير ذلك");
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    const saved = read();
    expect(saved.chronicConditions).toEqual({ other: true, otherText: "", selected: ["conditionDiabetes", "conditionHypertension"] });
    first.unmount();
    const profile = await start(<Profile />, saved);
    expect(screen.getByRole("checkbox", { name: "السكري" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "ارتفاع ضغط الدم" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "غير ذلك" })).toBeChecked();
    toggle("السكري");
    toggle("الربو");
    toggle("غير ذلك");
    const edited = read();
    expect(edited.chronicConditions).toEqual({ other: false, otherText: "", selected: ["conditionHypertension", "conditionAsthma"] });
    profile.unmount();
    await start(<Profile />, edited);
    expect(screen.getByRole("checkbox", { name: "السكري" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "الربو" })).toBeChecked();
  });

  it.each(["", "تفاصيل المستخدم القديمة"])("preserves legacy Other entries with text '%s'", async (otherText) => {
    await start(<Profile />, { chronicConditions: { other: true, otherText } });
    expect(read().chronicConditions).toEqual({ other: true, otherText });
    expect(screen.getByLabelText("اذكر المرض (اختياري)")).toHaveValue(otherText);
    toggle("أمراض القلب");
    expect(read().chronicConditions).toEqual({ other: true, otherText, selected: ["conditionHeart"] });
    fireEvent.change(screen.getByLabelText("اذكر المرض (اختياري)"), { target: { value: "تعديل" } });
    expect(read().chronicConditions.otherText).toBe("تعديل");
    toggle("غير ذلك");
    expect(read().chronicConditions).toEqual({ other: false, otherText: "", selected: ["conditionHeart"] });
  });

  it("changes only self-reported conditions, preserving medications, tracking and all profile settings", async () => {
    await start(<Profile />, { meds: SEED_MEDS, taken: { "2026-11-08|m1|07:00": true }, nickname: "اسم محفوظ", notifPref: "inapp", companion: "kabsoula", textScale: 1.15 });
    const before = read();
    for (const [label] of choices) toggle(label);
    expect(read().chronicConditions.selected).toEqual(choices.map(([, key]) => key));
    const { chronicConditions: _conditions, ...after } = read();
    expect(after).toEqual(before);
    for (const [label] of choices) toggle(label);
    expect(read().chronicConditions).toEqual({ other: false, otherText: "", selected: [] });
  });
});