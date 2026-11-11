import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider, doseKey, useApp, useTodayDoses } from "@/app/store";
import { Personalize } from "@/app/screens/Personalize";
import { Profile } from "@/app/screens/Profile";
import { MedForm } from "@/app/screens/Meds";
import { Identify } from "@/app/screens/Identify";
import { SEED_MEDS } from "@/app/data";
import { checkSafety } from "@/app/safety";

const read = () => JSON.parse(localStorage.getItem("kabsoul-demo-v1") ?? "{}");
afterEach(() => { cleanup(); localStorage.clear(); });

function State() {
  const app = useApp();
  const doses = useTodayDoses();
  return <><output data-testid="state">{JSON.stringify({ ...app, doses })}</output><button onClick={() => app.toggleTaken("m1", "07:00")}>take</button></>;
}

async function start(child: React.ReactNode, persisted = {}) {
  localStorage.setItem("kabsoul-demo-v1", JSON.stringify({ onboarded: true, ...persisted }));
  const result = render(<AppProvider>{child}<State /></AppProvider>);
  await waitFor(() => expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}").hydrated).toBe(true));
  return result;
}

const confirm = () => fireEvent.click(screen.getByRole("checkbox", { name: "راجعت اسم الدواء وتركيزه والجرعة والمواعيد حسب وصفتي" }));
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("Optional chronic condition", () => {
  it("can skip conditions without resetting existing medication data", async () => {
    await start(<Personalize />);
    fireEvent.click(screen.getByRole("button", { name: "تخطي الآن" }));
    expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}").screen).toBe("notifySetup");
    expect(read().meds).toEqual(SEED_MEDS);
    expect(read().chronicConditions).toBeUndefined();
  });
  it("allows Other without text and continuing onboarding", async () => {
    await start(<Personalize />);
    fireEvent.click(screen.getByRole("checkbox", { name: "غير ذلك" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(read().chronicConditions).toEqual({ other: true, otherText: "" });
    expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}").screen).toBe("notifySetup");
  });
  it("persists exact self-entered text, reopens, edits and removes it", async () => {
    const first = await start(<Profile />);
    fireEvent.click(screen.getByRole("checkbox", { name: "غير ذلك" }));
    fill("اذكر المرض (اختياري)", "حالة يكتبها المستخدم");
    const saved = read();
    first.unmount();
    await start(<Profile />, saved);
    expect(screen.getByLabelText("اذكر المرض (اختياري)")).toHaveValue("حالة يكتبها المستخدم");
    fill("اذكر المرض (اختياري)", "تعديل المستخدم");
    expect(read().chronicConditions.otherText).toBe("تعديل المستخدم");
    fill("اذكر المرض (اختياري)", "");
    expect(read().chronicConditions).toEqual({ other: true, otherText: "" });
    fireEvent.click(screen.getByRole("checkbox", { name: "غير ذلك" }));
    expect(read().chronicConditions).toEqual({ other: false, otherText: "" });
  });
});

describe("Medication name, strength and nickname", () => {
  it("adds a separate nickname while retaining official name and ingredient", async () => {
    await start(<MedForm initial={null} prefill={{ id: "new-med", name: "Aspirin", ingredient: "aspirin", strength: "81 mg" }} onClose={() => {}} />);
    expect(screen.getByLabelText("الجرعة الموصوفة لك")).toHaveValue("");
    fill("اسم الدواء عندك (اختياري)", " دواء الضغط ");
    expect(screen.getByRole("button", { name: "حفظ" })).toBeDisabled();
    confirm();
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    expect(read().meds.find((m: { id: string }) => m.id === "new-med")).toMatchObject({ name: "Aspirin", nickname: "دواء الضغط", ingredient: "aspirin", strength: "81 mg", dose: "", times: ["08:00"] });
  });
  it.each(["اسم الدواء", "تركيز المنتج (كما على العبوة)", "الجرعة الموصوفة لك", "المواعيد 1"])("invalidates confirmation when %s changes", async (label) => {
    await start(<MedForm initial={SEED_MEDS[0] ?? null} onClose={() => {}} />);
    confirm();
    fill(label, label === "المواعيد 1" ? "09:30" : "corrected");
    expect(screen.getByRole("button", { name: "حفظ" })).toBeDisabled();
  });
  it("edits and removes nicknames from existing records without changing tracking or schedules", async () => {
    const initial = SEED_MEDS[0];
    if (!initial) throw new Error("Missing seed");
    const first = await start(<MedForm initial={{ ...initial, nickname: "قديم" }} onClose={() => {}} />, { taken: { [doseKey(initial.id, "07:00")]: true } });
    fill("اسم الدواء عندك (اختياري)", "جديد");
    confirm();
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    const saved = read();
    expect(saved.meds[0].nickname).toBe("جديد");
    first.unmount();
    await start(<MedForm initial={saved.meds[0]} onClose={() => {}} />, saved);
    fill("اسم الدواء عندك (اختياري)", "");
    confirm();
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    expect(read().meds[0]).toMatchObject({ ...initial, nickname: "" });
    expect(read().taken[doseKey(initial.id, "07:00")]).toBe(true);
  });
  it("preserves legacy doses, sorted next-dose candidates and dose tracking", async () => {
    await start(null);
    const state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state.doses.map((d: { time: string }) => d.time)).toEqual(["07:00", "14:00", "21:00"]);
    fireEvent.click(screen.getByRole("button", { name: "take" }));
    expect(read().taken[doseKey("m1", "07:00")]).toBe(true);
    expect(read().meds).toEqual(SEED_MEDS);
    fireEvent.click(screen.getByRole("button", { name: "take" }));
    expect(read().taken[doseKey("m1", "07:00")]).toBeUndefined();
  });
  it("never uses nickname as clinical identity", () => {
    const warfarin = SEED_MEDS[1];
    if (!warfarin) throw new Error("Missing seed");
    const db = { meds: [{ id: "W", generic_name: "Warfarin", name_ar: null, brands: [], timing_ar: null, meal_ar: null }, { id: "A", generic_name: "Aspirin", name_ar: null, brands: [], timing_ar: null, meal_ar: null }, { id: "P", generic_name: "Paracetamol", name_ar: null, brands: [], timing_ar: null, meal_ar: null }], items: [], records: [{ id: "r", kind: "ddi" as const, source_key: null, medId: "W", otherMedId: "A", itemId: null, interaction_description: "x", recommendation: null, action_level: "caution", action_level_ar: "انتبه", gap_text_ar: null, reference_text: null, evidence_status_ar: null, pharmacist_reviewed_ar: null, review_status: "unverified" }] };
    const withNickname = checkSafety(db, ["aspirin"], [{ ...warfarin, nickname: "Paracetamol" }]);
    expect(withNickname.map(({ category, records }) => ({ category, records }))).toEqual(checkSafety(db, ["aspirin"], [warfarin]).map(({ category, records }) => ({ category, records })));
    expect(withNickname[0]?.category).toBe("caution");
  });
});

function ScanReview() {
  const { setCandidate, candidate } = useApp();
  return <><button onClick={() => setCandidate({ name: "Detected Name", ingredient: "", dose: "20 mg", source: "vision" })}>set observation</button>{candidate && <Identify />}</>;
}

it("keeps AI-detected official name editable and requires renewed confirmation after edits", async () => {
  await start(<ScanReview />);
  fireEvent.click(screen.getByRole("button", { name: "set observation" }));
  expect(screen.getByLabelText("اسم الدواء")).toHaveValue("Detected Name");
  expect(screen.getByRole("button", { name: "تأكيد الدواء والمتابعة" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fill("اسم الدواء", "User Correction");
  expect(screen.getByRole("button", { name: "تأكيد الدواء والمتابعة" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد الدواء والمتابعة" }));
  expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}").candidate.name).toBe("User Correction");
  expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}").screen).toBe("safety");
});