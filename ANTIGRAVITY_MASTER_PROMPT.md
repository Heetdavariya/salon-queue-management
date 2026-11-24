# Master Prompt for Google Antigravity + Gemini Pro

You are my senior product engineer, UI/UX designer, and QA engineer. Build the Salon Queue Management System specified in this repository. I am using Google Antigravity with Gemini Pro.

## Mandatory first action — do not code yet

1. Read `AGENTS.md` and every file inside `docs/`.
2. Treat those documents as the source of truth. Do not substitute a canteen, restaurant, appointment-booking, or generic admin project. This is specifically a **Salon Queue Management System**.
3. Summarise:
   - the problem and user roles;
   - all seven screens and their routes;
   - the queue statuses and allowed transitions;
   - the exact barber-selection/Call next rules;
   - waiting-time, duplicate-phone, no-show, cancellation, break, and queue-closing rules;
   - the acceptance-test checklist.
4. Identify genuine ambiguities or technical risks. Do not invent product requirements to fill gaps.
5. Propose a phased implementation plan, recommended data architecture, files to create/change, and how you will test each phase.
6. Wait for my approval before implementing.

## Product and quality expectations

Build a complete, polished, responsive website—not just a static UI or clickable mockup. Follow `docs/02-screens.md` for all seven screens:

- `/` Home
- `/join` Join Queue
- `/status/:id` My Status
- `/reception` Reception Dashboard
- `/barber/:name` Barber View
- `/display` Waiting Area TV
- `/admin` Owner Settings

Follow `docs/03-flows-rules.md` exactly for all business logic. The queue rules must live in one reusable domain/service module. The customer, receptionist, barber, and TV views must use the same persisted queue state. Changes should appear across separate browser sessions within five seconds under normal connectivity.

Use the stack in `AGENTS.md` unless you identify a concrete blocker and explain it before changing it. If hosted credentials are not available, build an honest local demo mode with seeded sample data and clearly explain what is needed for true multi-device synchronisation. Never claim localStorage is a real-time multi-device backend.

## Visual direction

Create a distinctive premium salon product:
- charcoal `#1F2937` with restrained gold `#D4A017`;
- refined typography, strong hierarchy, generous whitespace, rounded cards;
- clean, high-contrast status indicators;
- polished responsive layouts for mobile, 10-inch tablet landscape, and large TV landscape;
- subtle purposeful transitions, not distracting animations;
- all tap targets at least 44px on mobile;
- English/Gujarati toggle across every screen and message.

Avoid a generic dashboard template, excessive gradients, random colours, emoji icons, tiny text, dead buttons, and placeholder sections. Use realistic Indian sample names, salon services, durations, and ₹ prices. Do not expose phone numbers on the public TV screen.

## Build sequence — one phase at a time

After I approve your plan, implement in this order. At the end of each phase, run the app/checks, show what changed, and wait for my review before moving to the next phase.

### Phase 1 — foundation
- Set up React + Vite + TypeScript, Tailwind, routing, reusable layout, design tokens, and central EN/GU translations.
- Create all seven routes with sensible responsive page shells.
- Add realistic seeded demo services, barbers, and queue entries.
- Add README setup instructions and `.env.example`.
- Confirm `npm run dev` and production build work.

### Phase 2 — Home and Join Queue
- Implement `/` and `/join` exactly as documented.
- Make service multi-select, maximum-three validation, total duration/price calculation, barber preference selection, phone validation, duplicate-phone detection, queue-closed handling, and confirmation functional.
- Create a queue entry and token only once; navigate to the correct status page.

### Phase 3 — My Status
- Implement `/status/:id`, live position and wait estimate, second-in-line “Start coming” message, Called/“It's your turn” state, and confirmed cancellation.
- Verify that status updates when staff changes the queue.

### Phase 4 — Reception Dashboard
- Implement barber cards, ordered waiting list, walk-in form, Call next, No-show, and Cancel.
- Enforce barber eligibility and prevent a barber from receiving another active assignment.

### Phase 5 — Barber View and TV
- Implement `/barber/:name` with Start, Done, timer, next customer, and Available/On break.
- Implement `/display` with current token per barber and next five tokens.
- Verify updates propagate to all views within five seconds under normal connectivity.

### Phase 6 — Owner Settings
- Implement service management, barber on-duty settings, online queue open/close, automatic 30-minute pre-closing cutoff, and today's statistics.
- Verify disabled services disappear from Join Queue and walk-ins remain possible when online joining is closed.

### Phase 7 — edge cases, accessibility, and polish
- Implement every rule in `docs/03-flows-rules.md`.
- Add loading, empty, error, confirmation, and disconnected states.
- Check Gujarati text wrapping and overflow on all screens.
- Check keyboard usability, semantic labels, focus states, contrast, and 44px mobile tap targets.
- Do not add out-of-scope features.

### Phase 8 — full QA and bug fixing
- Execute every checkbox in `docs/03-flows-rules.md`.
- For each test, report PASS/FAIL and the exact way you tested it.
- Test separate browser sessions for customer, reception, barber, and TV where possible.
- Test refresh/persistence and responsive breakpoints.
- Fix all failures, rerun the affected tests, then rerun the full checklist.
- Run lint, unit/integration tests, and production build. Do not suppress errors to make checks appear green.
- Inspect the browser console and network requests for errors.

### Phase 9 — deployment readiness
- Prepare deployment based on the actual architecture. Use Vercel for frontend and Render/Railway for a backend if appropriate, or the selected hosted database platform.
- Check build commands, environment variables, route fallback behaviour, and ensure no production code depends on localhost.
- Give me exact deployment steps. Do not fabricate a live URL; add it to the top of README only after deployment is genuinely successful.
- Put staff demo PIN/login instructions directly below the live link, and ensure demo credentials are safe and clearly labelled.

## How to handle bugs and changes

When I report a bug:
1. Reproduce it or inspect the relevant code/logs.
2. Explain the likely root cause briefly.
3. State the expected behaviour from the docs.
4. Make the smallest safe fix.
5. Add or update a test that would catch the regression.
6. Rerun the relevant tests and report the result.

Do not “fix” one screen by breaking another. Do not redesign unrelated areas unless I ask. If a requirement is unclear, ask one focused question instead of guessing.

## Final handover

Do not declare the project complete until:
- all seven screens exist and their important controls work;
- queue rules are enforced centrally;
- data persistence and synchronisation are honestly described;
- the full documented checklist passes;
- lint/tests/build have been run and results reported;
- README, `.env.example`, and `prompts.md` are present;
- deployment instructions match the actual code and services;
- a real live demo URL is included only if deployment succeeded.

Start now with the mandatory document review and implementation plan. **Do not write code until I approve the plan.**
