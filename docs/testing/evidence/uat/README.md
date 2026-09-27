# User Acceptance Test Evidence

This folder holds the evidence behind the [User Acceptance Test Report](../../UserAcceptanceTestReport.md) of 26–27 September 2026.

## How the testing was done

The live site (https://parkease-bd.vercel.app) was tested end to end, the way each kind of person would use it. Every step (opening pages, filling forms, pressing buttons, paying) was carried out in a real Microsoft Edge browser, driven by [Playwright](https://playwright.dev) scripts so that each run was repeatable and recorded.

- **Accounts:** each role had its own account, created through the normal sign-up or invitation flow: a User, a Provider, a Guard (created by the Provider), and a Manager (invited by the Provider), plus the team's Admin account. Disposable [mail.tm](https://mail.tm) inboxes received the real verification codes and setup links.
- **Payments:** the SSLCOMMERZ **sandbox** with its published test card (`4111 1111 1111 1111`, OTP "Success"), so no real money moved.
- **Gate check:** a headless browser has no camera, so the value encoded in the User's QR pass was read from the booking and pasted into the Guard's "Enter credential manually" box. This is the same string the Guard's camera reads.
- **What was checked:** what each page showed, and the status code and message of every API call the page made (from the browser's network log). Screenshots were saved at key steps.
- **Root causes:** for each defect, the frontend and backend source on `main` was read to find the line responsible.

## Contents

| Folder | What it holds |
|---|---|
| `scripts/` | The Playwright scripts, numbered in the order the journeys were run. |
| `screenshots/` | Screenshots of the key steps, numbered by journey. |
| `results/` | Page-by-page crawl logs (status, heading, failed API calls, console errors) for public, Admin, User, and Provider pages. |

### Scripts

| Script | Journey |
|---|---|
| `lib.mjs`, `sess.mjs`, `relogin.mjs`, `mail.mjs` | Shared helpers: browser launch, network logging, login, and disposable inboxes. |
| `01`–`06` | Page crawls for public pages, the Admin, User, Provider, Guard, and Manager portals, and account registration with email verification. |
| `10`–`19` | User journey: vehicle, quote, hold, booking, SSLCOMMERZ and Refund Balance payment, cancellation, QR pass, Guard check-in, checkout request and Guard check-out (`17` and the retry in `19`; check-out failed, defect H-10). `18` (review, Provider reply, earnings) was prepared but couldn't run because no booking could be completed. |
| `20`–`26` | Money and trust: User withdrawal, Admin payout processing, and the dispute flow. |
| `30`–`42` | Provider onboarding: property, Admin approval, parking resource, parking right, listing, availability, Guard creation and shift, and Manager invitation. |

## Running the scripts

```bash
npm install playwright            # uses the installed Microsoft Edge; no browser download needed
export ADMIN_EMAIL=...            # the Admin account
export ADMIN_PASSWORD=...
export TEST_PASSWORD=...          # password for newly registered test accounts
export GUARD_PASSWORD=...
export MANAGER_PASSWORD=...
node scripts/01-public-pages.mjs
```

The scripts save login sessions (`state_*.json`) and test-account details (`acct_*.json`) next to the `scripts` folder. Those files contain live session cookies, so they are not committed and must never be.

Several scripts use the IDs of the bookings and property created during this test run, so they document what was done rather than being ready to rerun as-is.
