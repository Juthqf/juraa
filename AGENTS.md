<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- The prototype is a single-route app (`/`) with an in-memory screen stack in `src/app/store.tsx`; screens live in `src/app/screens/`. Why: reliable demo navigation without URL state.
- Safety logic is a pure function in `src/app/safety.ts` over `src/app/data.ts`; swap the dataset for a verified source there. Why: keeps clinical data replaceable and testable.
- Clinical reference tables are public-read, admin-write; interactions only become `verified` via a reviewer role and must have a reference (DB-enforced). Why: unverified data can never be presented as confirmed.
- CSV imports go through pure `src/app/csv-import.ts` validation then admin-only `importCsv` (dry-run by default, insert-only, forced `unverified`). Why: safe, testable, non-destructive imports.
- Smart scanner sends bounded inline images through a server function to Lovable AI; observations are schema-validated and confirmation is required before device-local medication saving. Food confirmation stays in memory, without clinical matching or image persistence. Why: preserves privacy and keeps recognition separate from clinical evidence.
- Nutrition content lives in `src/app/nutrition.ts` as structured records rendered by `src/app/screens/Nutrition.tsx`; only publish foods with complete content, no fabricated references. Why: content stays reviewable and extensible without page redesigns.
- No push-notification infrastructure exists; the app only records an in-app tracking preference (`notifPref`). Why: UI must never claim external reminders work until real delivery is built.
- Optional self-entered condition details share `ConditionFields` in personalization/profile and existing device persistence; an optional `selected` array extends the legacy `other`/`otherText` record without migration. Medication `nickname` is separate from `name` and never used for clinical matching. Why: backward-compatible personal labels must not change clinical identity.
- Medication form saves require explicit prescription review, invalidated by edits to official name, ingredient, strength, dose, or times; nickname remains text-only while recording is chat-owned. Why: preserve confirmation safeguards and existing iOS voice behavior.
- `LaunchWelcome` gates the app frame once per mount until the brief timer/skip and profile hydration complete, without writing storage or changing the screen stack. Why: prevent wrong-destination flashes while preserving existing returning-user detection.
- Treatment-journey stats are pure functions in `src/app/journey.ts` over existing device records; adherence counts only confirmed doses over due scheduled doses, past eligibility uses the current schedule (schedule history is not recorded), and unmeasurable metrics render as "unavailable". Why: honest adherence numbers that can never fabricate or misclassify dose history.
- Today's schedule uses device-local calendar dates and a live/resume clock through `dose-time.ts` and `use-device-time.ts`; preserve existing date-key strings without migration and leave journey calculations independent. Why: fix Home day boundaries without guessing historical timezone intent or changing historical metrics.
