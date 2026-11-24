# Salon Queue Management System — Screens & Features

This document is the source of truth for screen structure, content, responsive behaviour, and button actions. Build the screens listed here; do not invent extra product areas.

## Shared design and navigation

- **Theme:** Premium salon aesthetic; charcoal `#1F2937`, gold `#D4A017`, warm neutral surfaces, readable contrast, subtle borders/shadows, rounded cards.
- **Typography:** Clean sans-serif. Use strong hierarchy for tokens, customer names, wait times, and primary actions.
- **Language:** English/Gujarati toggle. Every visible label, validation message, status, and empty/error message must come from a central translation file. No hard-coded UI strings in screen components.
- **Responsive targets:** Customer and barber screens are mobile-first; reception is optimised for a 10-inch tablet in landscape but remains usable on desktop; TV display is designed for a large landscape screen and readability from approximately five metres.
- **Accessibility:** Minimum 44px touch targets on phone screens; keyboard focus states; semantic labels; clear contrast; do not communicate status by colour alone.
- **Shared state:** All queue-management screens must read and update the same persistent queue data and reflect changes automatically.

## Screen 1: Home

**Route:** `/`

**Users and purpose:** Customers; understand the salon's current queue and start joining.

**Top-to-bottom layout:**
1. Salon logo/name and a clear Open/Closed status with closing time when configured.
2. Live queue summary: number of people waiting and approximate wait.
3. Barber availability cards/chips, each showing name and status: Busy, Available, or On break.
4. Prominent gold **Join Queue** button.
5. Brief instructions explaining how queue tokens and notifications work.
6. Language toggle visible without dominating the page.

**Actions:**
- **Join Queue:** Opens `/join` when online joining is open.
- If online joining is closed, disable the action and show a clear explanation. Walk-ins may still be added by reception.
- Language toggle changes all labels and messages immediately.

**Responsive behaviour:** On mobile, stack the summary and barber cards; use a full-width primary action. On larger screens, use a centred content width and balanced cards.

**States:** Loading skeleton; no customers waiting (“No one waiting — walk right in!”); salon closed; online queue closed; recoverable loading error with retry.

## Screen 2: Join Queue

**Route:** `/join`

**Users and purpose:** Customers joining remotely.

**Top-to-bottom layout:**
1. Back link and page title.
2. Customer name field.
3. Phone number field; validate exactly 10 digits (Indian mobile-number format).
4. Service cards with English/Gujarati name, duration, and price. Multi-select, maximum three services.
5. Barber picker: **Any barber (fastest)** plus individual barber cards with name and availability.
6. Live booking summary: selected service duration total, price total, selected barber preference, and approximate expected wait.
7. Gold **Confirm & Get Token** button.

**Actions and validation:**
- Selecting/deselecting a service recalculates duration and price immediately.
- Do not allow more than three services. Explain the limit inline.
- Do not allow disabled services to be selected.
- A barber on break cannot be selected; explain that the barber is on break.
- Validate name and phone before confirming.
- If this phone number already has an active queue spot, show that existing spot rather than creating a duplicate.
- On successful confirmation, create a queue entry and navigate to `/status/:id`.

**Responsive behaviour:** Single-column form on mobile; service cards can use a two-column grid on wider screens. Keep the summary and confirm action easy to reach.

**States:** No services configured; no eligible barbers; queue closed; invalid name/phone; duplicate active phone; submission error with retry that does not create duplicate entries.

## Screen 3: My Status

**Route:** `/status/:id`

**Users and purpose:** Customers tracking their place in the queue.

**Top-to-bottom layout:**
1. Token number displayed prominently (for example, `S-14`).
2. Status label and queue position (for example, “4th in line”).
3. Estimated waiting time with a clear approximate indicator.
4. Selected services and barber preference/assigned barber.
5. Helpful status message and next-step guidance.
6. **Cancel my spot** action.

**Behaviour:**
- Status and position update automatically as queue state changes.
- When the customer becomes second in line for their eligible barber, show a **Start coming to the salon** banner.
- When called, show a high-visibility full-screen gold-accented **It's your turn! Go to [Barber]** state. Use a gentle pulse; do not rely on sound alone.
- Cancel opens a confirmation dialog. Confirming cancellation changes status to Cancelled; dismissing leaves it unchanged.

**Responsive behaviour:** Mobile-first, with token and status easy to see at a glance.

**States:** Waiting; second-in-line/start-coming; Called/your-turn; In chair; Done; Cancelled; token not found; connection/loading error.

## Screen 4: Reception Dashboard

**Route:** `/reception`

**Users and purpose:** Receptionist managing the live queue. Optimise for a 10-inch tablet in landscape.

**Layout:**
1. Header with salon name, live/online queue state, current time, and **+ Add walk-in**.
2. Barber cards in a clear row/grid. Each card shows barber name, availability/break state, current customer/token, service in progress, elapsed time or time estimate, and **Call next** when eligible.
3. Ordered waiting list/table showing token, customer name, services, preferred barber, waiting duration, and status.
4. Row actions: **No-show** for eligible Called customers and **Cancel** for active queue entries.
5. Highlight customers waiting more than 60 minutes in amber, while retaining readable text.

**Actions:**
- **+ Add walk-in:** Opens a quick form for customer name, phone, services, and barber preference. A valid walk-in joins the end of the same queue.
- **Call next:** Selects the earliest eligible waiting customer for that barber, following the exact rules in `03-flows-rules.md`.
- **No-show:** Available for a Called customer who has not arrived within the allowed period; asks for confirmation and updates the queue.
- **Cancel:** Confirms before cancelling an active entry.
- Changes update the barber, customer status, and TV views automatically.

**Responsive behaviour:** Tablet landscape is the primary layout. On narrow screens, stack barber cards above a compact queue list; do not hide essential actions.

**States:** Empty queue; all barbers on break; no eligible customer for a particular barber; loading; connection error with retry; action confirmation and success/error feedback.

## Screen 5: Barber View

**Route:** `/barber/:name`

**Users and purpose:** A barber using a phone to manage their own service queue.

**Layout:**
1. Barber name and current availability.
2. Current customer card: token, customer name, selected services, and timer since service start.
3. Large primary action: **Start** before service begins; **Done** while service is in progress.
4. “Next for you” preview with the next eligible token, customer name, and services.
5. **Available / On break** toggle.

**Actions:**
- **Start:** Changes the Called customer to In chair and starts the service timer.
- **Done:** Changes the customer to Done, clears the current slot, and refreshes eligible next-customer information.
- **On break:** Marks barber unavailable for new assignments; existing in-chair work may be completed.
- **Available:** Makes the barber eligible for new assignments again.

**Responsive behaviour:** Phone-first; large controls, minimal clutter, readable from arm's length.

**States:** No current customer; customer called but not started; service in progress; no next customer; barber on break; connection error.

## Screen 6: Waiting Area TV

**Route:** `/display`

**Users and purpose:** Waiting customers viewing a large landscape screen from approximately five metres away.

**Layout:**
1. Salon branding and a clear “Now serving” heading.
2. One large row/card per barber showing barber name, availability, and current token (or Available/On break).
3. **Up next** section showing the next five eligible tokens and estimated times.
4. Newly called token receives a brief gold highlight/pulse. Optional chime may be used, but visual notification is mandatory.

**Behaviour:**
- Updates automatically when a customer is called, started, completed, cancelled, or marked no-show.
- Do not show private phone numbers. Display only the minimum customer/token information needed for queue communication.

**Responsive behaviour:** Landscape TV layout with large type, high contrast, generous spacing, and no small dense tables.

**States:** No one waiting; no barber serving; all barbers on break; connection lost (show last update/connection warning without fabricating live data).

## Screen 7: Owner Settings

**Route:** `/admin`

**Users and purpose:** Owner/admin configuring daily salon operations.

**Layout:**
1. Services section: service name in English and Gujarati, duration in minutes, price in ₹, and enabled/disabled control.
2. Barbers on duty today: list of barbers with on-duty toggle and current availability.
3. Online queue switch: Open/Closed for online joining.
4. Today's statistics cards: customers served, average wait, and no-shows.

**Actions:**
- Edit/add/disable services. Disabled services disappear from `/join`; existing queue entries retain their original selected service details.
- Toggle barbers on duty. Do not silently reassign customers who selected a specific barber.
- Open/close online joining. Closing disables online customer joining with a clear message; reception can still add walk-ins.
- Statistics reflect actual records for the current day.

**Responsive behaviour:** Desktop/tablet settings layout; stack sections on mobile.

**States:** No services; no barbers configured; saving; validation error; settings load failure.

## Shared UI components

- Header/language toggle.
- Status badge with text and colour.
- Service selection card.
- Barber availability card.
- Queue token card.
- Confirmation dialog.
- Toast/inline feedback.
- Loading skeleton, empty state, and error state.

## Visual quality bar

Avoid a generic admin-template appearance. Use consistent spacing, polished card hierarchy, purposeful typography, subtle motion, and a restrained gold accent. The app must feel like one coherent salon product across customer, staff, and TV experiences.
