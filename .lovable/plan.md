# Juraa — Assessment: Real Background Push Notifications

Assessment only. No code or data changes until you approve.

## 1. What already exists
- Installable app details: app name, icons and iPhone Home Screen tags. There is no service worker, so the app has no offline mode and no background code.
- Notification screen: the user's preference (`notifPref`) is saved on the phone only. Nothing sends reminders.
- Medicines, times and dose history are saved only in the phone's browser. The server has no copy and no time zone.
- Lovable Cloud gives us a database, user accounts (email sign-in is used only for the admin page today), server functions and scheduled server tasks that can run every minute.
- Scientific database: the food-interaction table has `gap_minutes`, `gap_side` (drug_first / both) and `gap_text_ar`, copied as written from the workbook.

## 2. What is missing
- A messaging service worker that receives pushes and shows them when the app is closed.
- A push-sending service. Option A: Firebase Cloud Messaging, which Lovable can connect. Option B: standard Web Push with VAPID keys we generate, sent from a server function.
- A way to know who each phone belongs to. Patients don't sign in today. Either each phone gets an anonymous device ID tied to a secret token (no sign-in needed), or patients sign in.
- Server tables: push subscriptions (one per phone), a copy of the medicine schedule plus the phone's time zone, and a record of what was sent, so the same dose is never notified twice.
- A server task every minute that finds due doses, sends the reminder and records it.
- Keeping the copy in sync: when a medicine is added, edited or deleted, the phone updates its server copy, so changes and cancellations take effect at the next run.
- Updating the notification settings screen: a real on/off switch, the permission request, a test notification, and clear messages for when notifications are blocked or the iPhone app isn't installed.

## 3. Which notification types are possible
- **Medicine reminders:** possible on Android Chrome and desktop browsers. On iPhone (iOS 16.4+) they work only after the app is added to the Home Screen and opened from there. They don't work in Safari tabs or in the Lovable preview.
- **"Taken" button in the notification:** not reliable on iPhone. Tapping the notification should open the app to that dose.
- **Exact timing:** a reminder can arrive up to about a minute late, because the server task runs once a minute.

## 4. Does the scientific data support time-specific food reminders?
Only partly. Of 14 food records, 3 give an exact interval, all for Levothyroxine:
- **Coffee:** 60 minutes, coffee after the tablet ("٦٠ دقيقة بعد قرص ليفوثيروكسين"). This supports one reminder, sent at the dose, saying to wait 60 minutes before coffee.
- **Calcium:** at least 4 hours before or after ("٤ ساعات على الأقل قبل أو بعد").
- **Iron:** the same, at least 4 hours before or after.
- For calcium and iron the data gives no direction, only that the gap goes both ways. A reminder at the dose time can repeat the stored sentence word for word. A separate alert at "dose minus 4 hours" isn't safe, because we don't know when the user takes the supplement.
- **The other 11 food records**, including tea, matcha, dairy and grapefruit, have no interval. They get no timed reminder. At most, the dose reminder can mention the stored record without a time.
- **Medicine–medicine records:** none of the 36 has an interval, so none gets a timed reminder.
- All of these records are still "unverified". Every reminder would say it comes from demo data and doesn't replace the pharmacist.

## 5. The safest minimal approach
1. Set up a dedicated messaging service worker. This is only for notifications, with no offline caching, so it can't cause stale screens. It also doesn't register inside the preview frame.
2. Use standard Web Push with VAPID keys, which needs no new outside account. Firebase is the alternative if you prefer it.
3. Give each phone an anonymous ID, stored on the phone with a secret token. The server stores only the token's fingerprint.
   - New tables are reached only through server functions that check the token, with no public read access.
   - The server copy holds medicine names and times only. It includes no health conditions or nicknames.
4. Run a server task every minute that sends due reminders. It never sends the same dose twice, and it removes subscriptions that no longer work.
5. Add food reminders only for the 3 records with exact intervals. The wording is built from the stored `gap_text_ar` and food name, with no new instructions. Example: "تذكير من كبسول: حان موعد ليفوثيروكسين. قهوة: ٦٠ دقيقة بعد قرص ليفوثيروكسين."
6. Add a real on/off switch, a test notification and an option to delete the phone's subscription. The app claims reminders work only after a test notification arrives.
7. Add tests for duplicate prevention, time zones and which food records qualify. Then test on a real iPhone that has the app on its Home Screen.

## 6. Estimates (rough)
- **Size:** medium to large, about 6–9 implementation steps.
  - Server tables and secure access: small.
  - Service worker and subscribing: medium.
  - Schedule syncing: medium.
  - Minute-by-minute sending task: medium.
  - Food reminder rules and wording: small.
  - Settings screen: small to medium.
  - Tests: small.
- **Credits:** roughly comparable to the scanner or chat upgrades, likely 2–4 working rounds. More if real-device problems need fixing.
- **Running cost:** the every-minute server task keeps the backend active all the time, which adds a small but ongoing Cloud cost.

## 7. Risks and limitations
- **iPhone:** works only when the app is installed on the Home Screen, on iOS 16.4 or later. iOS can delay or group notifications, and Focus or Low Power modes can hold them.
- **Can't test here:** testing is possible only on the published site, not in the Lovable preview. A real iPhone test needs you to publish, install the app on your Home Screen and allow notifications.
- **Out of sync:** if the phone is offline when you change a medicine, the server copy is out of date until the app opens again.
- **Data leaves the phone:** medicine names and times are stored on the server for the first time. The settings screen should say so clearly.
- **Deleting data:** clearing the browser removes the device ID, so we'd add a "stop reminders" option inside the app.
- **Demo data:** reminders are based on unverified records, so every notification keeps the demo disclaimer.

## Decisions needed from you
- Push service: standard Web Push (my suggestion) or Firebase.
- Device ID without sign-in (my suggestion), or require patients to sign in.
- Calcium and iron: a reminder at dose time repeating the stored sentence, or leave them out.
