# Provider Onboarding Verification

## Location-First Revision (2026-10-04)

The initial pass below is superseded by the location-first flow. Existing-property matching previously ORed address fingerprints, name/area equality and a broad coordinate rectangle. It now accepts coordinates alone, filters by geographic distance within 75 meters, ranks nearest first and returns a nearby-candidate explanation. The radius is not a verified building identity. No automatic merge or authority grant occurs.

The separate setup route redirects into the canonical property workspace. That workspace contains three parking tabs (spaces/amenities, availability/vehicle rates, review/publish); existing images and advanced authority/settings remain accessible there.

Local browser checks covered automatic first-step lookup, no-match progression, a nearby candidate with distance before any name/address entry, mandatory candidate confirmation, retained details, review-only progression, explicit final submit and mobile document overflow. The review transition exposed an unintended submit from a reused button; distinct button keys, prevented default and a step guard fixed it. A retest remained on `/provider/properties/new` with an enabled final-submit button instead of creating a record.

One synthetic `QA - Onboarding Preview` property (`8477c714-7b0e-4f09-853c-3651307a408e`) was created when that bug was reproduced. It is pending/inactive, with no parking inventory, approval, publication or payment. It was retained, not silently deleted. No real user property or financial record was changed.

Verification: 66 frontend tests passed; frontend/backend typechecks and changed-file lint passed; backend compilation passed. Six compiled geographic assertions plus coordinate-only/invalid-latitude schema checks passed. Full backend npm test execution retains the earlier Windows tsx runner limitation. No spatial extension or schema migration was applied to the live database.

## Initial Pass

Date: 2026-10-04. Target: localhost:3000, existing Provider test account.

## Implemented Scope

- New-property form: details, location/access, photos/review. Optional operational fields remain accessible without crowding the initial step.
- Verified-property guided setup: fixed spaces and amenities, weekly hours and per-vehicle rate drafts, photos, review/publish.
- Separate vehicle offers share one physical resource and verified authority. Backend serializes activation and active scope edits, rejecting overlapping vehicle/unit offers.
- Existing live, combined and specialized offers and dated/multi-window schedules remain protected; use the existing property workspace for those cases.
- Unsaved-edit confirmation, pending navigation controls, meaningful local validation errors, retained values after partial rate-save failure, and authority-request retry after space creation.

## Completed Checks

| Check | Result |
| --- | --- |
| Frontend unit suite | 66 passed |
| Frontend TypeScript | Passed |
| Changed frontend files ESLint | Passed |
| Backend TypeScript and compilation | Passed |
| Compiled listing overlap checks | Four assertions passed: disjoint vehicle tariffs, whole/unit overlap, separate units, identical scopes |
| Browser empty property details | Specific required errors; first invalid field focused |
| Browser populated details | Advances to address/map/access step |
| Browser unsaved exit | Confirmation shown; no record submission |
| Existing verified property setup | Real property/resource names, real inventory and rights statuses |
| Browser empty space form | Explicit name/prefix/count/vehicle validation; no create request needed |
| Existing live combined offer | Guided pricing is locked with a recovery explanation |
| Responsive inspection | 390px mobile and 1440px desktop inspected; no document horizontal overflow at 390px |

## Limitations

The backend npm unit runner fails before tests execute with Windows `uv_os_get_passwd ENOMEM` in tsx. The compiled helper assertions are a fallback, not a claim that the full backend suite passed.

No property/resource creation, authority approval, listing publication, payment or withdrawal was submitted against the shared live database during browser verification. Successful multi-endpoint persistence, concurrent activation and full booking checkout still require a QA database or an explicitly supervised test. An isolated frontend production build was not run in this pass; the running user's `.next` was left intact.

The simplified editor supports one recurring opening interval per day and unified deposit/duration/overtime settings across its vehicle tariffs. Shared pools and more complex legacy terms remain in the advanced workspace. Browser history navigation is not intercepted; refresh/close and in-app links have unsaved-edit protection.
