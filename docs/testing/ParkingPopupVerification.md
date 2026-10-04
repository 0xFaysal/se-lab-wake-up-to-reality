# Parking Map Popup Redesign

Local verification: 2026-10-04.

- Shared public/Driver map popup now prioritizes property name, actual available capacity and hourly price.
- Neutral location note replaces amber warning styling; approximate coordinates and the 40-metre radius remain unchanged.
- White text on emerald overrides Leaflet's default blue link styling. Computed colors verified: `rgb(255, 255, 255)` on `rgb(6, 78, 59)`.
- Scoped CSS only affects parking-result popups, not other Leaflet maps.
- Popup updates its position after selected-marker movement and keeps top clearance for the map's search-area control.
- Default desktop viewport: full title, close button, content and action visible.
- 390px mobile viewport: popup width 314px, left 32.8px, right 346.8px; fits screen. Existing results sheet remains unchanged.
- Mobile View offers click navigated to the correct Driver property route with vehicle type and selected start/end preserved.
- Frontend typecheck and targeted ESLint passed; 74 frontend tests passed.
- No consent, coordinates, payment or backend behavior changed. No booking was created.

Evidence: `evidence/parking-popup-redesign.jpg` and `evidence/parking-popup-mobile.jpg`.
