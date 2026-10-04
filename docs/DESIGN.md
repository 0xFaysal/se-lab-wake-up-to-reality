---
name: Urban Harmony
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#404944'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#064E3B'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#59605e'
  on-secondary: '#ffffff'
  secondary-container: '#dbe1df'
  on-secondary-container: '#5d6463'
  tertiary: '#2d2e2c'
  on-tertiary: '#ffffff'
  tertiary-container: '#434442'
  on-tertiary-container: '#b1b1ae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#dee4e2'
  secondary-fixed-dim: '#c2c8c6'
  on-secondary-fixed: '#171d1c'
  on-secondary-fixed-variant: '#424847'
  tertiary-fixed: '#e3e2e0'
  tertiary-fixed-dim: '#c7c6c4'
  on-tertiary-fixed: '#1a1c1a'
  on-tertiary-fixed-variant: '#464745'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

> **Figma Canvas:** [ParkEase BD — UI/UX Design](https://www.figma.com/design/xpGwQGsxbzN8kQK0IubMPU/ParkEase-BD-%E2%80%94-UI-UX-Design?node-id=0-1&t=wANRYM1Cb6R2qjlc-1)
>
> **Screen Catalog & Specifications:** [UI/README.md](../UI/README.md)

The design system is built for a premium residential parking marketplace that prioritizes trust, order, and calm within a dense urban environment. The aesthetic moves away from generic digital services toward a high-end, professionally art-directed editorial style.

The visual direction is **Modern Minimalist with a focus on Craftsmanship**. It utilizes expansive white space, precise geometric alignment, and a sophisticated color palette to evoke a "Smart City" atmosphere. The emotional response should be one of relief and reliability—positioning the platform as a premium utility that brings order to Dhaka's parking challenges. Avoid all trends associated with "hype" culture, such as neon accents or aggressive gradients, in favor of a timeless, institutional quality.

## Colors

The color palette is grounded in natural, architectural tones to feel locally relevant and professionally anchored.

- **Primary (Deep Emerald):** Used for primary actions, brand presence, and critical navigation. It represents stability and growth.
- **Surface (Muted Sage):** Used for large background sections or container backgrounds to provide a softer alternative to pure white, reducing eye strain.
- **Background (Warm Ivory):** The base canvas for the entire application, providing a premium, gallery-like feel.
- **Neutral (Ink):** A very dark charcoal used for primary text to ensure high legibility while remaining softer than pure black.
- **Accent (Gold/Ochre - Optional):** For high-priority status indicators like "Reserved" or "Premium Spot," use a muted gold (#B45309) to maintain the sophisticated tone.

## Typography

This design system uses a dual-font approach to balance technical precision with readability. **Geist** provides a technical, geometric edge for headings and data points, while **Hanken Grotesk** offers a softer, more legible experience for longer descriptive text.

Headlines should be treated as editorial elements. Large display type is intended to sit with significant negative space. Ensure that tracking is tightened on larger sizes to maintain a "lock-up" feel. For mobile, scale down display sizes aggressively to prevent awkward line breaks while maintaining the heavy font weight for visual impact.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. Content is centered within a maximum width of 1280px for desktop to maintain readability, while margins expand gracefully on larger displays.

- **Grid:** Use a 12-column grid for desktop and a 4-column grid for mobile.
- **Rhythm:** All spacing must be a multiple of 8px. Use 64px or 80px for vertical section spacing to maintain the "premium" airy feel.
- **Map View:** For the marketplace search, use a split-pane layout (50/50 or 60/40) where the map is fixed on the right and the scrollable list is on the left. On mobile, the map should be a toggleable layer or a top-weighted element with a pull-up drawer for listings.

## Elevation & Depth

This design system avoids heavy shadows and floating effects. Depth is achieved primarily through **Tonal Layering** and **Refined Outlines**.

- **Level 0 (Base):** Warm Ivory (#FAF9F6) background.
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px solid border (#E5E7EB).
- **Shadows:** Only use a single, very soft "Ambient" shadow for active or hovered cards. The shadow should be highly diffused: `0px 10px 30px rgba(6, 78, 59, 0.04)`. The slight emerald tint in the shadow ensures it feels integrated with the brand color.
- **Interactive Depth:** When a user interacts with a card, do not lift it significantly; instead, slightly darken the border color or add a subtle 2px inner stroke in the primary emerald color.

## Shapes

The shape language is "Refined Rounded." It uses generous corner radii to soften the technical nature of a parking app and make it feel more approachable and residential.

- **Standard Containers:** Use `16px` (rounded-lg) for most cards and input groups.
- **Large Sections:** Use `24px` (rounded-xl) for hero image containers or prominent feature blocks.
- **Buttons:** Use `8px` for a professional, slightly sharper look compared to cards, or a full pill-shape for floating action buttons.
- **Icons:** Icons should be 24px bounding box, using a medium 1.5pt stroke weight with rounded caps and joins to match the UI's roundedness.

## Components

- **Buttons:** Primary buttons are solid Deep Emerald (#064E3B) with white Geist medium text. Secondary buttons are Muted Sage (#ECF2F0) with Emerald text. No gradients.
- **Cards:** Pure white backgrounds with 1px #E5E7EB borders. Card headers should use Geist for the title and Hanken Grotesk for description. Use 24px padding for all internal card content.
- **Input Fields:** Use a subtle background fill (#F3F4F6) with no border in its default state. On focus, transition to a white background with a 2px Deep Emerald border.
- **Chips/Badges:** For status (e.g., "Available", "EV Charging"), use small, semi-transparent fills of the primary color with Geist Bold labels at 11px.
- **Maps:** Use a custom-styled map (Mapbox/Google) that de-saturates urban features and highlights roads in soft greys, with parking pins in the Primary Deep Emerald color.
- **Lists:** Use "Divided Lists" where each item is separated by a 1px hairline border, avoiding the "boxed" look for data-heavy views like transaction histories.
- **Search Bar:** A prominent, wide element with a 16px corner radius, featuring a refined magnifying glass icon and "Dhaka" pre-filled as a placeholder to ground the app locally.

## Guard Operations Register

The Guard portal uses the same Urban Harmony foundations in a denser, operations-first register called **Gate Control Desk**. Its signature interaction is the live emerald scan command: a high-contrast QR action with a restrained status pulse that remains easy to find under time pressure.

- **Responsive shell:** mobile uses a four-item bottom navigation with a raised Scan action; desktop uses a persistent 280px operations rail and a wide content workspace.
- **Operational hierarchy:** checkout requests appear before future arrivals; vehicle plate, space, and status remain the strongest information in every booking row.
- **Safety:** check-in and checkout require explicit confirmation and keep server-returned pending, success, and error states visible. Guard views never show booking prices, deposits, payouts, or platform revenue.
- **Accessibility:** controls have at least a 44px hit area, scan results are announced through live status text, camera start is user-initiated, and manual credential entry remains available when camera permission or hardware fails.
- **Runtime tokens:** `--guard-canvas` maps to warm ivory, `--guard-surface` to white, `--guard-ink` to the primary text color, `--guard-mint` to the supporting emerald surface, `--guard-line` to the refined outline, and `--guard-warning` to muted ochre. These tokens are defined in `frontend/app/globals.css` and are the canonical Guard-specific aliases.

## Provider Gate Team Handoff

Provider Guard management uses a lifecycle-led workbench instead of treating the assignment table as the Guard directory. The selected Property is the canonical page scope and the full membership roster stays visible through pending acceptance, accepted/ready, and inactive states.

- **Sequence:** create or find account → add to Property → Guard accepts → Provider assigns shift.
- **State language:** amber means Guard action is required, sky means the membership is accepted and Provider action is required, and emerald means an active operational shift.
- **Recovery:** an existing-membership conflict refreshes and highlights the roster rather than presenting a dead-end error. Account creation attempts the Property invitation automatically and preserves the new account if invitation delivery must be retried.
- **Separation:** Property membership and Provider assignment remain distinct records; the interface explains the boundary and never implies that account creation alone grants booking access.

## Provider Clean Operations Register

Approved for the Provider route group, not a replacement for other roles. Existing runtime Segoe UI/Arial fonts remain authoritative; earlier font examples are not a request to download fonts.

| Decision | Runtime owner |
| --- | --- |
| Canvas `#F6F8FA`, white surfaces, charcoal `#20272E`, emerald action `#064E3B` | `frontend/app/provider/provider-workspace.css`; scoped aliases adapt the existing Tailwind theme |
| 28px desktop / 24px mobile page headings, 14px body, zero tracking, tabular amounts | Provider workspace CSS, `ProviderPageHeader` |
| Restrained borders, 8px repeated-item corners, no oversized promotional panels | Provider CSS and shared Provider components |
| One navigation registry, longest-prefix active state, shared mobile modules | `provider-navigation.ts` and Provider layout/sidebar |
| Real notification badge, accessible account menu, name-only Profile | `provider-account-menu.tsx`, existing account API and shared personal-info form |
| Blue reserved, emerald parked, amber grace, red overtime; labels and dashed holds/blocks | `provider-session-workspace.tsx` |

Live Sessions uses real fixed units and a single capacity row per shared pool. Concurrent activity occupies separate lanes; mobile defaults to a list. Date navigation is Asia/Dhaka today plus six days. Sections remain unframed; individual tools and repeated items may have borders. `UI/owner/` supplies workflow inspiration only, not mock data or financial rules.

Timeline labels use Dhaka 12-hour AM/PM time. Hour-axis labels align with grid coordinates, reservation bars show their exact interval, and the unframed reservation timing table exposes entry/exit grace durations including saved legacy terms. Grace strip widths represent actual minutes without padding-based enlargement; equal durations have equal widths. The same times appear in list, drawer, tooltip and keyboard-accessible booking controls.

### Provider Property Onboarding

`UI/owner/add-parking-space/` informs the sequence, not its mock contact fields or business rules. New property submission has three steps: find the building on the map, property details/access, photos/review. Nearby-property discovery runs in the first step before requiring address/name input. Optional building and safety fields are collapsed. Verified properties use one resource-centric workspace for real spaces, authority, opening hours and booking settings. The former setup route redirects to this workspace; no second setup wizard or duplicate advanced inventory is rendered. Images remain in their existing section.

Use compact labeled fields, the shared Select/Checkbox/Dialog primitives, restrained step navigation, and the existing Provider tokens. Show property/resource names, never IDs as selected labels. Vehicle hourly inputs are BDT; persisted prices are exact paisa. Existing specialized offers and dated/multi-window schedules are protected from simplified-form overwrites.

Display actual current tariffs and vehicle scope, not disabled zero placeholders. Resource rows are unframed white bands: inventory actions at the top, authority and booking settings in two desktop columns, stacked on mobile. Spot codes expand on demand. One full booking-settings form edits price, deposit, duration, description and overtime. Separate vehicle pricing is explicit, not a silent split. Offer creation is scoped to a resource and shown only for vehicles not already covered; there is no generic second New Listing footer.

Parking workspace creation and editing open in shared accessible dialogs, never append a second editor below the inventory. Dialog headers remain visible above a contained scrolling body, with an 8px radius and responsive viewport limits. Dismissal protects unsaved edits. Authority amendments show the original version, permissions, dates and evidence alongside prefilled proposed fields; verified evidence cannot be removed through an amendment.

### Parking Location Disclosure

Parking map popups use a compact white 8px surface with the property name, real availability and hourly price ahead of a neutral location note. Approximate-pin information is informational slate, not amber error styling. The scoped popup action overrides Leaflet link colors with white text on emerald, including hover and keyboard focus. No verification or exact-location promise is inferred from the visual treatment.

Public coordinates use a 50-metre metric grid; its rounded centre remains within the displayed 40-metre approximate area of the actual location in Bangladesh. Public maps label price markers as area markers, not building entrances. This replaces the earlier coarse neighbourhood grid at the user's request; it offers less location privacy than that earlier policy. New-property duplicate discovery still checks actual coordinates within 75 metres across eligible platform properties; an empty result does not mean there are no properties in the wider neighbourhood.

Providers may opt each offer into pre-booking location disclosure from its booking settings or offer creation form. Consent defaults to false and follows an offer when its vehicle rates are split. An authenticated, email-verified, active Driver may obtain actual coordinates for an active, authorized offer through a private, non-cacheable endpoint. Private address text, access instructions and credentials remain confirmed-booking-only. Offers without consent retain their existing booking flow with explicit location-availability warnings; no consent is inferred or enabled for existing records.
