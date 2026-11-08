import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider, useApp } from "@/app/store";
import { Home } from "@/app/screens/Home";
import { BottomNav } from "@/app/ui";

function NavigationHarness() {
  const { screen: current, back } = useApp();
  return <><Home /><BottomNav /><output data-testid="destination">{current}</output><button onClick={back}>Test back</button></>;
}

afterEach(() => { cleanup(); localStorage.clear(); });

async function start(companion = "kabsoul") {
  localStorage.setItem("kabsoul-demo-v1", JSON.stringify({ onboarded: true, lang: "ar", companion }));
  render(<AppProvider><NavigationHarness /></AppProvider>);
  await waitFor(() => expect(screen.getByTestId("destination")).toHaveTextContent("home"));
}

describe("Homepage navigation", () => {
  it.each([
    ["الرئيسية", "home"], ["أدويتي", "meds"], ["الكاميرا", "scan"],
    ["التغذية", "nutrition"], ["حسابي", "profile"],
  ])("opens %s through bottom navigation", async (label, destination) => {
    await start();
    fireEvent.click(screen.getByRole("navigation").querySelector(`[aria-label="${label}"]`) ?? screen.getByRole("button", { name: label, exact: true }));
    expect(screen.getByTestId("destination")).toHaveTextContent(destination);
  });

  it.each([["kabsoul", "اسأل كبسول"], ["kabsoula", "اسألي كبسولة"]])("opens chat for the selected %s and returns home", async (companion, label) => {
    await start(companion);
    fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
    expect(screen.getByTestId("destination")).toHaveTextContent("chat");
    fireEvent.click(screen.getByRole("button", { name: "Test back" }));
    expect(screen.getByTestId("destination")).toHaveTextContent("home");
    expect(JSON.parse(localStorage.getItem("kabsoul-demo-v1") ?? "{}").companion).toBe(companion);
  });
});