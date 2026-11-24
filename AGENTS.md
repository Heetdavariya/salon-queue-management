# AGENTS.md — Salon Queue Management System

Build a polished, working Salon Queue Management System. Customers join and track a live queue; receptionists and barbers manage it; a waiting-area TV shows the current queue.

## Read these documents first

- `docs/01-brief.md` — problem, users, required features, and exclusions.
- `docs/02-screens.md` — all seven screens, routes, layouts, actions, and responsive states.
- `docs/03-flows-rules.md` — queue flows, status transitions, assignment rules, waiting-time logic, edge cases, and acceptance tests.

These documents are the product specification. If something is unclear or contradictory, stop and ask before making a product decision. Do not silently invent features or change queue rules.

## Stack and architecture

- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS; use reusable components and a coherent design system.
- Routing: React Router.
- Icons: a consistent icon library; do not use emoji as interface icons.
- Data: choose the simplest reliable persistent shared storage that synchronises separate customer, reception, barber, and TV browser sessions. Prefer a hosted backend/database with real-time subscriptions (for example, Supabase) when credentials are available. If credentials are unavailable, create a clearly labelled local demo mode with seeded data and explain its limitations; do not pretend local-only storage synchronises across devices.
- Validate all inputs and enforce queue rules in a central service/domain layer, not only in UI components.
- Keep secrets in environment variables. Never commit credentials.
- Provide `.env.example` with variable names and setup instructions, never real secrets.
- Run locally with `npm install` and `npm run dev`. Provide working `build`, `lint`, and test scripts.

## Design rules

- Premium salon look: charcoal `#1F2937`, gold `#D4A017`, warm neutral surfaces, readable contrast, rounded cards, deliberate whitespace, subtle motion.
- Mobile-first customer and barber screens; reception optimised for 10-inch tablet landscape; TV display designed for large landscape screens and readability from five metres.
- Minimum 44px touch targets on mobile.
- All visible labels and messages must use central English/Gujarati translation resources. No hard-coded user-facing strings in components.
- Include loading, empty, validation, error, and disconnected states.
- Do not expose customer phone numbers on the TV display.

## Working rules

1. Before coding, read all four specification files and summarise the product, screens, and queue rules. List ambiguities and propose an implementation plan. Wait for approval before large implementation work.
2. Work in small steps: one screen or cohesive feature per task. Do not rewrite unrelated screens.
3. Keep queue statuses, transitions, eligibility, barber assignment, waiting-time calculation, and duplicate-phone logic in one shared domain module.
4. Follow the documented scope. Do not add online payments, appointments, SMS/WhatsApp, loyalty, or multiple branches.
5. Use realistic Indian sample data and prices in ₹. Mark demo/test accounts clearly.
6. After each step, run relevant checks, report changed files, and explain how to test the feature.
7. Do not claim a feature works unless you have run and verified it. Never hide failing tests.
8. Before finishing, run the complete test checklist in `docs/03-flows-rules.md`, fix failures, and report pass/fail evidence.
9. Test customer, reception, barber, and TV views in separate browser sessions where possible; test mobile, tablet landscape, and TV/desktop breakpoints.
10. Keep `README.md` current. The first content after the title must be the real live demo URL once deployed, followed by hosting details and staff demo PIN/login instructions. Never invent a deployed URL.
11. Maintain `prompts.md` with every prompt used, in order, including unsuccessful prompts.
12. Do not stop at a visually complete mock-up: all visible buttons and important flows must work end to end.

## Completion requirements

- App starts and production build succeeds.
- All seven routes/screens in `docs/02-screens.md` exist and work.
- Shared queue state persists and synchronises as specified, or demo-mode limitations are explicitly documented.
- Test checklist is executed with results.
- README includes setup, environment variables, test instructions, deployment instructions, and the real live link when deployed.
