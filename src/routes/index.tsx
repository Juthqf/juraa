import { createFileRoute } from "@tanstack/react-router";
import { KabsoulApp } from "@/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جرعة | Juraa" },
      { name: "description", content: "رفيقك الذكي لتنظيم أدويتك ومتابعة رحلتك العلاجية. معك في كل جرعة." },
      { property: "og:title", content: "جرعة | Juraa" },
      { property: "og:description", content: "رفيقك الذكي لتنظيم أدويتك ومتابعة رحلتك العلاجية. معك في كل جرعة." },
      { name: "twitter:title", content: "جرعة | Juraa" },
      { name: "twitter:description", content: "رفيقك الذكي لتنظيم أدويتك ومتابعة رحلتك العلاجية. معك في كل جرعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KabsoulApp,
});
