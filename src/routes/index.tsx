import { createFileRoute } from "@tanstack/react-router";
import { KabsoulApp } from "@/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kabsoul & Kabsoula — كبسول وكبسولة" },
      { name: "description", content: "A calm Saudi medication companion: reminders, medicine scanning and safety checks with Kabsoul & Kabsoula." },
      { property: "og:title", content: "Kabsoul & Kabsoula — كبسول وكبسولة" },
      { property: "og:description", content: "A calm Saudi medication companion: reminders, scanning and safety checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KabsoulApp,
});
