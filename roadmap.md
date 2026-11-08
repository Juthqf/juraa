# Controlled enhancement (Nov 2026 brief)

- [x] Onboarding: personalization screen (optional nickname, text size عادي/كبير with live preview) after mascot pick; التالي/تخطي الآن/رجوع; persist; no repeat.
- [x] Onboarding: notification setup screen — honest (no push infra): in-app schedule tracking or "لاحقًا"; no permission request.
- [x] Settings: edit nickname, mascot, text size, notification status reflecting real capabilities only.
- [x] Nutrition library "التغذية": 6 categories, shared food records, search, category + detail pages, 8 complete foods; no fabricated refs/hadith; neutral link to existing safety checker.
- [x] Wording: "نسبة الجرعات المسجّلة اليوم"; "نساعدك تنظّم مواعيد أدويتك حسب تعليمات الوصفة" in About; no auto-rescheduling claims.
- [x] Regression test: onboarding/skip/persist, settings edits, 6 categories, search, RTL iPhone layout, scanner/chat/schedule/checker intact.
- [x] Final report delivered in chat.

# Navigation update
- [x] Keep five RTL bottom destinations with centered scanner and profile retained.
- [x] Open chat from the selected greeting mascot with an accessible cue and back navigation.
- [x] Verify all destinations and mascot access on mobile and desktop.

# Homepage cleanup
- [x] Remove only the scanner and assistant shortcut cards; retain existing section spacing.
- [x] Verify dose tracking, progress, medication links, and unchanged navigation at phone, tablet, and desktop sizes.

# PWA installation support (جرعة)
- [x] Web app manifest: name/short_name جرعة, standalone, start_url /, theme/background matching palette, 192/512 icons.
- [x] Brand app icon derived from palette (mascots stay in-app only); favicon from same mark.
- [x] Apple touch icon + iOS standalone metadata in root head.
- [x] No service worker, no push, no caching changes; verify manifest serves and build stays clean.

# Optional conditions and medication nickname
- [x] Add optional Other condition in personalization/profile using existing device storage; no invented condition options.
- [x] Add separate editable medication nickname and editable strength with explicit name/dose/time confirmation.
- [x] Preserve existing voice implementation; report text-only nickname fallback.
- [x] Test persistence, scanner confirmation, medication edits, legacy data, dose tracking, and mobile layout; report files and device limits.

# Chronic conditions checklist only
- [x] Add seven requested conditions alongside optional Other in the shared selection UI.
- [x] Persist multiple selections in existing profile storage without changing legacy Other entries or unrelated data.
- [x] Test optional selection, profile edits/removal, reload and backward compatibility; verify mobile/desktop and report changed files.

# Welcome splash only
- [x] Add launch-only, tap-to-skip welcome using existing mascots and requested Arabic copy.
- [x] Preserve hydration, existing onboarding detection, all saved data and post-launch navigation.
- [x] Test new/returning launch, timeout/skip, navigation and reload; check mobile/desktop and report real-device limits.

# Welcome splash timing and animation
- [x] Lengthen the automatic welcome to 3 seconds, keep instant tap-to-skip, and add a one-shot fade-and-rise entrance that honours reduced motion.
- [x] Update duration-dependent tests; verify auto-advance, skip speed, both destinations, mobile layout and reduced motion.

# Treatment journey dashboard (رحلتي العلاجية)
- [x] Pure stats module (journey.ts): adherence = confirmed/due scheduled ×100; unconfirmed never assumed taken or missed; unavailable states for skipped doses and missing history.
- [x] Journey screen: today/week/month/all ranges, stat cards, streak, tracking start, day-by-day chart (weekly buckets >31 days), interactions section pending verified data.
- [x] Home entry card; no changes to meds entry, scanner, chat, profile, navigation, or storage.
- [x] Test calculations, ranges, classification, empty/multi-med/schedule-change cases, persistence, RTL mobile/desktop with large text.

# Home time handling and navigation clearance
- [x] Correct future-dose selection, live clock/resume updates and local midnight handling without rewriting historical records.
- [x] Keep confirmation toggle and navigation design; provide safe-area-aware Home clearance measured from navigation border-box and raised camera.
- [x] Test time boundaries, confirmation, regressions and browser layouts: 83 tests pass; 13 time tests also pass in Riyadh/Los Angeles; mobile/desktop and simulated 34px inset verified. Real iPhone Safari and installed PWA require hardware testing.
