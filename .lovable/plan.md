# Juraa prototype: connect the workbook database (Demo Mode)

Source: DOSE_APP.xlsx is the only scientific content. Nothing is invented, reworded or dropped. All work is additive.

## Stage 1 — Additive database changes
New columns on the existing tables (no renames or drops):
- medications: workbook `source_key` (unique), row no., Arabic name, class, use, timing text + code, meal text + code, notes, evidence status, pharmacist-reviewed flag, reviewer name/date (exact text).
- drug_food_interactions / drug_drug_interactions: `source_key` (unique), row no., `item_id`, `action_level` (تجنب/انتبه kept exactly, stored as avoid/caution plus original Arabic), gap text, gap_minutes, gap_side, note, evidence status, pharmacist-reviewed flag, conflict_group. drug_drug gets an optional `item_2_id` so the 3 rows whose second party is calcium/antacids are kept as-is (exactly one of medicine/item required).
- references: unique `code` (SYN, WAR…), `published_text`.
New tables (public read, admin write, same as existing):
- interaction_items (15 foods/supplements/OTC)
- medication_brand_names (179)
- record_references (each record → each reference, with section and "how it supports")
- review_tasks (pharmacist review sheet, 45 rows, statuses unchanged)
- source_appendix (the 4 source-sheet appendices kept verbatim, so nothing is silently dropped)
Existing `review_status` stays `unverified` for every imported row; reviewer-only verification rule is untouched. The old severity enum column is left at `unknown` and not used.

## Stage 2 — Import (dry run first)
- A one-off import script reads the workbook (cached formula values), builds rows, and reports a dry run: expected 18 / 15 / 179 / 14 / 36 plus references, links, review tasks; checks every link resolves and no duplicates.
- Then writes using "insert or update by source key", so re-running changes nothing.
- Arabic text compared byte-for-byte against the workbook after import.
- Stop and report if any count, link or text check fails.

## Stage 3 — Demo Mode + app connection
- Demo Mode is always on in this prototype and clearly labeled; it lets all imported records (any review status) be shown. Each alert shows its evidence status as written in the workbook and is never called "verified".
- Disclaimer shown on Safety, Identify/Scan confirmation and Home alerts: «نسخة تجريبية لأغراض العرض، وليست للاستخدام في اتخاذ قرارات علاجية.»
- A public read server function loads the workbook dataset once (cached) into the app.
- Screens switched to the real data:
  - Medication search (Scan manual search) → workbook medicines + Arabic + brand names.
  - Identify/confirmation → match scanned name/ingredient to workbook medicine by generic or brand name; if no match, user corrects or picks manually; never invents a medicine.
  - Safety checker (drug–drug and drug–food) and Home alerts → workbook records with exact recommendation, action level, gap, note and references.
  - Nutrition → shows workbook drug–food links for the user's medicines where items match; existing nutrition articles unchanged.
- No match → «لم يُرصد تعارض في قاعدة بيانات جرعة الحالية.», never "safe", never blocks.
- The sample interaction list and the "known ingredient = no interaction" shortcut are removed from the checker. Users' saved medicines, schedules and settings on the device are untouched (the old sample starter medicines stay only for brand-new users, as now).

## Stage 4 — Tests and report
- Unit tests: matching by generic/brand, both pair directions, item-type pairs, no-match message, action levels preserved, unverified rows never labeled verified.
- Import check: counts, re-import = 0 changes, text identical.
- Permissions: anonymous/regular users can read only, cannot write or verify.
- Browser check on mobile RTL: search, identify, checker, nutrition links, disclaimer.
- Final report: migrations, actual counts, test results, open issues (the possible reference shift in drug rows 35–37 and the duplicate «م» 41 are imported as-is and flagged, not edited).

## Technical notes
- Migrations via the migration tool; data writes via SQL data tool (upsert on source_key); import script kept in repo as a pure parser with tests.
- `safety.ts` stays a pure function, now over a dataset type loaded from the database.
- AGENTS.md rules updated (dataset source, Demo Mode, import upsert).
