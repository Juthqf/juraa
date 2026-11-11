# Scientific database import — analysis (no changes made)

Status: analysis only. Nothing in the database, code, or screens was changed. The Excel workbook has not been provided, so the worksheet-to-table mapping is **still pending**.

## 1. Current database (checked live)
All four tables exist and contain 0 rows.

| Table | Required | Optional | Rules |
|---|---|---|---|
| medications | generic_name (1–200 chars, **unique**) | brand_names[], active_ingredients[], strength (≤100), dosage_form (≤100) | — |
| references | title (1–500) | organization_or_authors (≤500), publication_year (1800–2100), url_or_doi (≤1000), verification_date | — |
| drug_food_interactions | medication_id, food_or_beverage (1–200), interaction_description (1–4000) | severity (high/moderate/low/unknown, default unknown), recommendation (≤4000), reference_id | review_status default unverified; verified requires a reference |
| drug_drug_interactions | medication_1_id, medication_2_id (must differ), interaction_description | same as above | **one row per drug pair** (order-independent); verified requires reference |

- Links: interactions point to medications and references; deleting a linked medicine/reference is blocked.
- Access: anyone can read; only admins can write; only a reviewer role can mark "verified".
- Review statuses: unverified, under_review, verified, rejected.

## 2. How the app uses medicine data today
- The safety checker, medicine search, scanner matching, and Treatment Journey do **not** read these tables. They use the built-in illustrative sample list on the device.
- Missing pairs show "insufficient information" (never "safe"); this behaviour is correct and will be kept.
- The only code that touches these tables is the admin CSV import (dry-run by default, insert-only, forces "unverified").
- User schedules, doses, and settings live only on the phone, so imports cannot overwrite them.

## 3. Can it hold a pharmacist-reviewed workbook without loss?
Partly. Likely blockers, to confirm against your workbook:
1. **Generic name must be unique** — several strengths/forms of the same medicine cannot be stored as separate rows.
2. **One drug–drug row per pair** — several distinct interactions or sources for one pair cannot be stored.
3. **No duplicate guard for drug–food** — re-importing would create duplicates.
4. **One reference per interaction** — multiple citations would be lost.
5. **No pharmacist approval details** — no approver, approval date, or review notes; approval is only a role check at the moment of verifying.
6. **No stable source ID** — rows can only be matched by name, which is fragile for updates.
7. **Missing clinical fields often found in such workbooks** — mechanism, clinical effect, evidence level, onset, management/monitoring, timing separation (e.g. "take 4 hours apart"), Arabic text for descriptions/recommendations, ingredient-level vs product-level interactions, SFDA registration number.
8. **Severity scale is fixed** at high/moderate/low/unknown — scales like "contraindicated/major/minor" need an agreed mapping or a new value.
9. **Import tool limits** — the CSV importer forces every interaction to "unverified", so your pharmacist approvals would not carry over automatically.

## 4. Proposed mapping (pending the workbook)
Order: References → Medications → Drug–food → Drug–drug.
- Each sheet maps to one table; medicines are matched by generic name and references by title (or a new source ID).
- Columns without a home are listed and **not dropped silently**; the import stops until you decide.
- Delivered as a column-by-column table for your approval before anything is imported.

## 5. How approval controls alerts
- Only **verified** interactions (reviewer-approved, with a reference) may appear as a confirmed alert.
- unverified / under_review: shown, if at all, as "not yet clinically reviewed", never as confirmed.
- rejected: never shown.
- No record: "no reviewed information available — absence does not mean safe".
- Proposal: carry the workbook's pharmacist approval only when it includes approver + date, recorded as evidence; otherwise import as unverified for in-app review.

## 6. Safe future updates
- Add a stable source ID per row (from the workbook) and a dataset version/import date.
- Updates match on source ID: new rows are added, changed rows are updated **and moved back to under review** unless re-approved, removed rows are marked retired (never deleted).
- Always dry-run first with a report: X new, Y changed, Z unchanged, errors.
- All-or-nothing per import; user data on the phone is never touched.

## Next steps (only after your approval)
1. You share the workbook (or one sample row per sheet with headers).
2. I return the exact column mapping and the list of required schema additions.
3. Additive-only database changes (no deletions or renames), after your explicit approval.
4. Update the importer, dry-run, review the report with you, then import.
5. Separately: connect the safety checker to verified records only.

## Technical details
- Blocking constraints: `medications_generic_name_key` UNIQUE(generic_name); `ddi_unique_pair` unique on LEAST/GREATEST of the pair; no unique index on drug_food_interactions(medication_id, food_or_beverage).
- Checks: `ddi_verified_needs_reference`, `dfi_verified_needs_reference`, `ddi_distinct_meds`; FKs ON DELETE RESTRICT; trigger `guard_review_status` restricts verified to `reviewer`.
- `importCsv` forces `review_status: 'unverified'`; `safety.ts` reads `data.ts` only.
