# Salon Queue Management System — Project Brief & Scope

## 1. Problem

Customers often visit a salon without knowing how many people are ahead of them or how long they will wait. This creates uncertainty, crowding, frustration, and disputes about whose turn is next.

The Salon Queue Management System will let customers join a live queue, see their position and estimated waiting time, and receive a clear notification when it is their turn. Reception staff and barbers will manage the same queue, while a public display will keep waiting customers informed.

## 2. Users

- **Customer:** Joins the queue remotely or at the salon, chooses services and a barber preference, and tracks their token.
- **Receptionist:** Adds walk-in customers, manages the waiting list, calls the next eligible customer, and handles cancellations and no-shows.
- **Barber:** Views their current and next customers, starts and completes services, and changes availability or break status.
- **Owner/Admin:** Maintains services, prices, durations, barbers on duty, queue availability, and daily statistics.

## 3. Goals

1. Make joining and tracking the queue simple on a mobile phone.
2. Keep customer, reception, barber, and waiting-area screens consistent.
3. Respect first-come-first-served order and each customer's barber preference.
4. Make queue status and estimated waiting time understandable.
5. Provide a polished, responsive interface suitable for a real salon.

## 4. Must-have features

1. **Customer queue joining:** Customer enters their name and 10-digit phone number, selects up to three services, and chooses a specific barber or “Any barber”.
2. **Live customer status:** Show token, queue position, estimated waiting time, “Start coming” when the customer is second in line, and a prominent “It's your turn!” state when called.
3. **Reception dashboard:** Show barber cards and the ordered waiting list; support walk-in creation, Call next, No-show, and Cancel.
4. **Barber view:** Show the current customer, selected services, service timer, next eligible customer, Start/Done actions, and Available/On break control.
5. **Waiting-area display:** Show each barber's current token and the next five tokens with estimated times; visibly highlight a newly called token.
6. **Owner settings:** Manage services (English/Gujarati name, duration, price, enabled state), barbers on duty, online queue open/closed state, and today's statistics.
7. **English/Gujarati language toggle:** All user-facing labels and messages must be translated consistently.
8. **Shared live queue state:** Customer, reception, barber, and TV screens must stay in sync without manual refresh.

## 5. Out of scope — do NOT build

- Online payments or payment gateway.
- Future-date appointments or appointment calendar.
- SMS or WhatsApp messaging integrations.
- Loyalty points, memberships, or rewards.
- Multiple salon branches or multi-tenant management.
- Unrequested features that complicate the core queue workflow.

## 6. Look and feel

Premium, modern salon experience: dark charcoal foundation (`#1F2937`), warm gold accent (`#D4A017`), clean typography, rounded cards, generous spacing, clear status colours, and mobile-first layouts. The interface must support English and Gujarati.

## 7. Success criteria

The project is successful when a customer can join and track a queue; reception can manage it; barbers can start and finish customers; the waiting-area display updates; owner settings affect the customer flow; and the key rules in `03-flows-rules.md` pass the documented tests.
