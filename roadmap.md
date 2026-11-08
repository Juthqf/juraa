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
- [ ] Add seven requested conditions alongside optional Other in the shared selection UI.
- [ ] Persist multiple selections in existing profile storage without changing legacy Other entries or unrelated data.
- [ ] Test optional selection, profile edits/removal, reload and backward compatibility; verify mobile/desktop and report changed files.
