# Unified Property Workspace Verification

Date: 2026-10-04. Target: localhost:3000, Provider test account.

## Findings And Fixes

- Duplicate guided setup plus advanced inventory: property page now mounts only the resource-centric workspace.
- Unscoped New Listing footer: removed. Resource-specific Add vehicle pricing appears only for vehicle types not covered by current offers.
- Active offers allowed only hourly-rate edits: full booking settings now edit name, description, accepted vehicles, deposit, duration limits and overtime as well as hourly pricing.
- No separate rates within a combined vehicle offer: explicit separate pricing performs an atomic, version-checked server conversion. It retains physical inventory, existing booking IDs/snapshots and settlement destination. Existing conflict/authority checks remain in force.
- Blank weekly hours: shared parser accepts both HH:mm and serialized database-time values.
- Opening-hour saves reset validity dates: each interval now retains its original start/end validity dates.
- Losing unsaved edits: booking settings and opening hours use the shared navigation guard. Closing opening hours is disabled during its save.

## Verification

- Frontend unit suite: 69 passed.
- Frontend/backend TypeScript: passed. Backend production compilation: passed.
- Changed frontend files lint: passed without warnings.
- Two compiled backend tariff/schema unit tests passed; five earlier compiled assertions also passed. The tsx test runner still fails before execution with Windows uv_os_get_passwd ENOMEM.
- Local browser: one workspace; no duplicate setup steps or generic New Listing for the fully covered existing resource. Full form loaded BDT 12.00, deposit 400.00 and existing durations/overtime. Separate Sedan/SUV/Motorcycle fields appeared. Zero rate produced a specific inline error without a valid API update. Cancellation showed the unsaved-change confirmation.
- Existing weekly hours rendered 08:00 to 22:00, rather than blank inputs.
- Mobile (390px) and tablet (768px): vehicle-rate fields remained inside the viewport without horizontal document overflow. Mobile fields stacked clearly; tablet fields used two columns. No duplicate element IDs were found. Temporary edits were discarded and the browser viewport was restored.

## Boundaries

## Modal Follow-Up

- Single/bulk creation, space editing, authority claims/amendments, booking settings, additional vehicle pricing and availability exception edits now use the shared accessible workspace dialog. Opening hours also opens in a dialog rather than below the resource list.
- Current authority summary includes original version, permissions, quantity and validity dates. Verified evidence remains viewable, not removable from the amendment form; new evidence belongs to the change request.
- Authority amendments preserve unchanged timestamp precision and the original use permission.
- Local browser verified single/bulk, space editing, opening hours, prefilled authority/evidence and booking settings dialogs. Changed permission dismissal showed the discard confirmation; all temporary edits were discarded. Escape dismissed an unchanged dialog. At 390px the booking editor stayed inside the viewport with contained vertical scrolling.
- Frontend unit suite: 69 passed. Typecheck and changed-file lint passed. No live creation, authority amendment, rate or hours save was submitted.

No live rate, hours, booking, permission, payment or balance was changed during these browser checks. Transaction rollback, real persistence and concurrent requests have not been integration-tested against the shared live database. No migration/deployment or frontend production build was performed; the user's running development build is preserved.
