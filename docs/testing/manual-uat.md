# Stage 15.7 remaining manual UAT

Status: **not executed**. Record tester, date, deployed revision, browser/OS/device versions, evidence and outcome beside each check. Automated desktop engines do not establish these results. Use an approved test environment and designated test accounts/orders; do not alter production customer data for this audit.

## Real browsers and devices

- [ ] Actual iPhone Safari: browse/configure/cart, pickup and delivery checkout, confirmation and tracking; repeat in portrait and landscape.
- [ ] Actual Android Chrome: same guest flow; registration/login, Profile/Security, history/detail and session-expiry recovery.
- [ ] Hardware tablet: 768px or comparable layout, orientation changes, scrolling and navigation disclosure.
- [ ] Desktop Safari and Firefox: native browser text-only 200% resize and 400% page zoom; menus, dialogs, checkout and account pages stay usable without lost content or controls.
- [ ] Soft keyboard: each auth/checkout/tracking field remains visible; focused input and submit action are reachable; closing the keyboard restores usable scrolling.
- [ ] Notches/home indicators: configurator/cart/mobile-navigation/checkout actions clear the actual safe area; no accidental double padding or obstruction.
- [ ] Touch: frequent actions, quantity controls, password visibility, filters and pagination are usable without precision taps.
- [ ] Confirm the customer drawer Tab-cycle fix on real Safari with native keyboard preferences recorded; every destination is reachable, reverse wrapping works and Escape restores focus.
- [ ] Repeat a long customer journey in real Safari/WebKit with the deployed artifact and actual test sessions. Investigate the retained 10-second loading timeouts after repeated navigation; record time to interactive. Do not assume axe is the cause: the screenshots-only run also timed out later on session loading. Treat a normal checkout stall as a release-blocking P1.
- [ ] Reproduce the documented 320px/200% root-font header stress finding using actual mobile text-size settings; record severity and obtain a separate disposition before implementing any P2 refinement.
- [ ] Long product/customer/address/modifier data: wrapping, clipped descriptions and totals retain necessary information.

## Assistive technology and keyboard

- [ ] VoiceOver on iOS/macOS and NVDA on Windows: record actual spoken output and versions.
- [ ] Skip link, landmarks and page headings establish context on each route.
- [ ] Product/cart/mobile-navigation dialogs contain focus, expose one understandable name, close with Escape and return focus to the initiating control.
- [ ] Radio choices announce group, required state, price and selection; arrow keys work; optional extras remain understandable.
- [ ] Login/register/checkout/tracking validation announces associated errors once and moves focus to a useful location.
- [ ] Server failure, loading, submission success and refreshed tracking status announce meaningful feedback without duplicate speech.
- [ ] Order timeline distinguishes current recorded status, earlier steps and future steps; cancelled orders do not suggest progress.
- [ ] Profile/Security disclosures, account menu and order filters announce expanded/current state correctly.
- [ ] Reduced motion removes nonessential movement while busy/submission feedback remains understandable.
- [ ] Focus outline remains perceivable on light, charcoal and overlay surfaces, including sticky/fixed control boundaries.
- [ ] Review every axe `incomplete` finding in retained JSON with the actual rendered content; do not treat `incomplete` as a pass.

## Deployment and operational acceptance

- [ ] Confirm approved deployed commit/artifact matches the audited working tree, API origin, cookie settings and intended production configuration.
- [ ] Authorized live Google OAuth with a designated test identity: callback/return path, cancellation, conflict and explicit account linking. The controlled provider regression does not validate live Google configuration.
- [ ] Verify allowed-origin/redirect behavior and Customer/Admin isolation in the actual deployment without using real customer data.
- [ ] Confirm documented API replica/throttle configuration, health checks, monitoring, backup/restore and rollback readiness with the operator.
- [ ] Measure deployed pages with consistent mobile Lighthouse/lab settings and representative catalog/order sizes; capture raw artifacts. Diagnose LCP >2.5s or CLS >0.1.
- [ ] Collect real-user LCP/CLS/INP when telemetry or CrUX data exists; INP target <=200ms must use field data, not automation elapsed time.
- [ ] Product owner signs off actual desktop/tablet/mobile appearance against the accepted Stage 15 design and records remaining P2/P3 disposition.

Completion requires named evidence for each item or an explicit release-owner risk acceptance. This checklist does not authorize deployment or new feature work.
