# Salon Queue Management System — Flows & Rules

This document is the source of truth for queue behaviour. Implement these rules centrally and reuse them across all screens. Do not create separate, conflicting queue logic in individual components.

## 1. Main flow: remote customer

1. Customer opens Home (`/`) and checks salon/queue status.
2. Customer opens Join Queue (`/join`), enters name and phone, selects one or more services (maximum three), and chooses a specific barber or Any barber.
3. The system validates the details and checks for an existing active spot for the same phone number.
4. If valid and not already active, the system creates a queue entry with the next token (for example, `S-14`) and places it at the end of the queue.
5. Customer is sent to My Status (`/status/:id`) and can see token, position, and estimated wait.
6. When the customer is second in line for their eligible barber, show “Start coming to the salon”.
7. Receptionist selects **Call next** on a barber's card. The earliest eligible customer becomes Called.
8. Customer's status screen shows “It's your turn! Go to [Barber]”; the TV highlights the token.
9. Barber taps **Start**; the customer becomes In chair.
10. Barber taps **Done**; the customer becomes Done and leaves the active queue.

## 2. Main flow: walk-in customer

1. Receptionist selects **+ Add walk-in**.
2. Receptionist enters name, phone, selected services, and barber preference.
3. System validates the same required fields and service limits as remote joining.
4. Walk-in is added to the end of the same queue and receives a token.
5. Customer is managed through the same Called → In chair → Done process.

## 3. Statuses and allowed transitions

Use these statuses consistently:

- **Waiting:** Customer is in the queue and has not been called.
- **Called:** Reception has called the customer for a specific barber.
- **In chair:** Barber has started the service.
- **Done:** Service is completed; entry is no longer active.
- **Cancelled:** Customer/reception cancelled the active spot.
- **No-show:** Customer was called but did not arrive within the allowed period.

Allowed transitions:

- `Waiting → Called`
- `Waiting → Cancelled`
- `Called → In chair`
- `Called → No-show`
- `Called → Cancelled` only if reception explicitly cancels before service starts
- `In chair → Done`

Do not move Done, Cancelled, or No-show entries back into an active state. If a no-show customer returns, create a new entry at the end with a new token. Preserve a timestamped history of status changes.

## 4. Queue ordering and barber assignment rules

1. **First come, first served:** Queue order is based on the time the entry was successfully created. Walk-ins and remote customers use the same queue.
2. **Call next for barber X:** Select the earliest Waiting customer whose preference is either barber X or Any barber.
3. A customer who selected a specific barber must never be assigned to another barber.
4. An Any barber customer may be assigned to an available barber when that barber's Call next action is used.
5. A barber can have only one Called/In chair active customer assigned at a time. Do not allow a second customer to be called while the barber already has an active assignment.
6. A barber on break or not on duty cannot receive a new customer.
7. A barber on break may finish a customer already In chair, but cannot receive a new assignment.
8. Calling a customer must atomically reserve that customer and barber so that two staff actions cannot call the same customer at the same time.
9. Do not reorder the queue to make a preferred barber appear faster. Eligibility is determined by the customer's barber preference and the selected barber's availability.

## 5. Waiting-time estimate

Use the handout's approximation:

`Estimated wait ≈ total minutes of services ahead ÷ number of barbers working`

Implementation guidance:
- Calculate using customers ahead who are eligible for the customer's selected barber or Any barber, while respecting specific-barber restrictions.
- For a specific-barber customer, do not count other barbers as capacity for that customer's service.
- For an Any barber customer, estimate using currently working/available service capacity and the eligible queue ahead.
- Never divide by zero. If no eligible barber is working, show “Wait time unavailable — no barber currently available” rather than `0 min`.
- Show the estimate as approximate, not guaranteed.
- Recalculate when queue order, service selections, barber availability, or service completion changes.
- If a customer is already Called or In chair, show the corresponding status rather than a misleading waiting position.

## 6. Duplicate phone number rule

- A phone number may have only one active spot at a time.
- Active statuses are Waiting, Called, and In chair.
- If the same phone number tries to join again while an active spot exists, show the existing token/status and link to its status page; do not create a duplicate.
- Once the earlier entry is Done, Cancelled, or No-show, the phone number may join again.

## 7. No-show and cancellation rules

- A Called customer who has not arrived within 10 minutes may be marked No-show by reception.
- Require confirmation before marking No-show.
- No-show removes the entry from the active queue and releases the barber assignment if service has not started.
- If the customer arrives later, reception creates a new walk-in entry at the end of the queue with a new token.
- Customer cancellation is available from My Status while the entry is Waiting or Called; show a confirmation dialog.
- Reception may cancel an active entry with confirmation.
- Do not allow cancellation of a Done, No-show, or already Cancelled entry.

## 8. Queue opening and closing

- Owner can open or close online joining.
- When online joining is closed, Home and Join Queue clearly explain that online joining is unavailable and disable confirmation.
- Reception can continue to add walk-ins while online joining is closed.
- Online joining automatically closes 30 minutes before the configured salon closing time.
- Do not accept remote entries after the automatic cutoff, even if the UI has not refreshed; enforce the rule in the operation that creates the entry.

## 9. Barber on break

- A barber on break is ineligible for new assignments.
- A customer who specifically selected that barber sees a clear message such as “[Barber name] is on break”.
- Do not silently transfer that customer to another barber.
- Any barber customers remain eligible for other working barbers.
- A barber may finish a service already In chair before or during a break.

## 10. Live synchronisation

- Customer status, reception dashboard, barber view, and TV display must reflect queue changes within five seconds under normal connectivity.
- Updates must not require a manual page refresh.
- Handle reconnects and stale data gracefully. Show a connection warning when the app cannot confirm live state.
- Do not display fabricated live values when disconnected.

## 11. Validation and data integrity

- Customer name is required.
- Phone number must contain exactly 10 digits.
- Select at least one service and no more than three.
- Services must be enabled at the time of joining.
- Service duration and price totals must equal the sum of selected services.
- Use a single shared queue-rule module for ordering, eligibility, transitions, estimates, and duplicate checks.
- Persist queue entries and settings so a refresh does not erase the day's queue.
- Keep private phone numbers off the public TV display.

## 12. Test checklist

- [ ] Join with two services; total duration and price equal the sum of both services.
- [ ] Selecting a fourth service is prevented with a clear explanation.
- [ ] Invalid or incomplete phone number is rejected.
- [ ] Same phone number attempts to join twice; existing active spot is shown and no duplicate is created.
- [ ] Customer who selected Ravi is never called by Amit.
- [ ] Call next for Amit skips a waiting customer who selected Ravi and selects the earliest eligible Amit/Any customer.
- [ ] An Any barber customer can be assigned to an available barber.
- [ ] A barber with an active Called/In chair assignment cannot receive another customer.
- [ ] A barber on break receives no new assignment.
- [ ] Call next changes the customer's status and TV display within five seconds.
- [ ] Start changes Called to In chair and starts the timer.
- [ ] Done changes In chair to Done and updates reception, TV, and customer status.
- [ ] Called customer can be marked No-show after 10 minutes with confirmation.
- [ ] No-show customer re-added as a walk-in receives a new token at the end of the queue.
- [ ] Customer cancellation requires confirmation and removes the entry from active queue.
- [ ] Closing online joining disables remote joining but still permits receptionist walk-ins.
- [ ] Online joining closes automatically 30 minutes before configured closing time.
- [ ] Estimated wait never displays zero when eligible people are ahead and never divides by zero.
- [ ] Estimated wait decreases/recalculates when customers finish or barber availability changes.
- [ ] English/Gujarati toggle translates every screen, validation message, and status.
- [ ] Phone, tablet, and TV views stay in sync without manual refresh.
- [ ] TV display does not expose customer phone numbers.
- [ ] Refreshing the app does not erase persisted queue entries or salon settings.
