# Existing Property Rates Verification

Date: 2026-10-04. Target: localhost:3000. No deployment.

## Fixes

- Active listings previously had no edit action, and the guided editor rejected live/combined/specialized offers while displaying blank disabled rates.
- Both entry points now use the same exact-money, hourly-rate-only update. Existing offer scope, deposit and overtime terms are retained. Existing bookings use their stored rate/quote snapshots; the update endpoint writes the listing and price history, not booking records.
- Existing offers and weekly opening hours are edited independently. Dated/multiple-window availability still uses the advanced editor.
- Resource workspace uses compact inventory actions, expandable real spot codes, operating authority and offers/rates columns. Mobile stacks these sections without nested cards.

## Checks

| Check | Result |
| --- | --- |
| Frontend tests | 68 passed, including exact hourly-rate-only payload and invalid rate rejection |
| Frontend typecheck | Passed |
| Changed frontend files lint | Passed |
| Existing active offer | Real BDT 12.00 loaded in both rate editors |
| Zero rate | Specific inline validation; no valid update submitted |
| Advanced navigation | Single canonical `#parking-advanced` fragment observed |
| Responsive workspace | Default desktop and 390px mobile screenshots inspected; editor controls wrap |
| Unsaved rate navigation | Confirmation shown; Keep editing preserves entered rate; Cancel discards without saving |
| Mobile DOM | No horizontal overflow or duplicate field IDs |

## Safety And Limitations

No live rate, opening hours, authority, booking or balance was changed during browser checks. Successful save against shared live data was deliberately not submitted; server rejection and successful persistence remain untested in this browser pass. No production build was run, preserving the user's running development build. The optional design audit script could not run because Python is not on PATH.
