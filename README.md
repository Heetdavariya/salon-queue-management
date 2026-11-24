
# Royal Touch Hair Studio — Salon Queue Management System

A modern, bilingual salon queue management system designed for Royal Touch Hair Studio. It provides real-time queue management for receptionists, barbers, customers, and salon owners.

**Live Demo:** [Royal Touch Hair Studio](https://salon-queue-management-oqns.vercel.app)

**Repository:** [GitHub - salon-queue-management](https://github.com/Heetdavariya/salon-queue-management)

For deployment instructions, see the [Deployment Instructions](#deployment-instructions) section below.

---

## Staff Demo Quick Navigation

| Module | Route | Description |
|---|---|---|
| Reception Dashboard | [/reception](https://salon-queue-management-oqns.vercel.app/reception) | Tablet landscape layout — manage queue, add walk-ins, mark no-shows, and call next customer. |
| Barber Station — Ravi | [/barber/Ravi](https://salon-queue-management-oqns.vercel.app/barber/Ravi) | Mobile barber view — live service timer, Start/Done controls, and break toggle. |
| Barber Station — Amit | [/barber/Amit](https://salon-queue-management-oqns.vercel.app/barber/Amit) | Mobile barber view — live service timer and availability controls. |
| Barber Station — Suresh | [/barber/Suresh](https://salon-queue-management-oqns.vercel.app/barber/Suresh) | Mobile barber view — live service timer and availability controls. |
| Waiting Area TV Screen | [/display](https://salon-queue-management-oqns.vercel.app/display) | High-contrast landscape display for 5-meter viewing, live pulse and audio chime, with no customer phone numbers. |
| Owner & Salon Settings | [/admin](https://salon-queue-management-oqns.vercel.app/admin) | Edit services, manage barber availability, configure queue hours, view daily metrics, and reset demo data. |
| Customer Join Queue | [/join](https://salon-queue-management-oqns.vercel.app/join) | Remote queue joining, maximum 3 services, dynamic duration and pricing, and 10-digit Indian phone validation. |
| Customer Live Status | [/status/q-active-1](https://salon-queue-management-oqns.vercel.app/status/q-active-1) | Live queue position, estimated waiting time, "Start coming" alert, and "It's your turn!" gold pulse banner. |

---

## 23-Item Acceptance Test Results

Reference: `docs/03-flows-rules.md`

| # | Acceptance Requirement | Test Suite & Method | Status |
|---|---|---|:---:|
| 1 | Join with two services; total duration and price equal sum | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 2 | Selecting a fourth service is prevented with clear explanation | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 3 | Invalid or incomplete phone number is rejected (10 digits) | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 4 | Duplicate phone detection links to active token without duplicate | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 5 | Customer who selected Ravi is never called by Amit | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 6 | Amit skips waiting Ravi customer and selects earliest eligible Amit/Any customer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 7 | Any-barber customer can be assigned to any available barber | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 8 | Barber with active Called/In-chair assignment cannot receive another customer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 9 | Barber on break or off-duty receives no new assignment | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 10 | Call next transitions status from WAITING to CALLED and syncs TV | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 11 | Start changes status to IN_CHAIR and initializes service timer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 12 | Done changes status to DONE and clears active assignment across all views | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 13 | Called customer can be marked No-show after 10 minutes with confirmation | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 14 | No-show customer re-added as walk-in receives new token at queue tail | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 15 | Customer cancellation requires confirmation and removes active spot | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 16 | Closed online queue disables remote join but allows receptionist walk-ins | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 17 | Online joining closes automatically 30 minutes before closing time | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 18 | Estimated wait never displays 0 when people are ahead and never divides by 0 | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 19 | Estimated wait decreases when customers finish or barbers become available | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 20 | English and Gujarati dictionaries have 100% complete parity | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 21 | Multi-tab views stay in sync via BroadcastChannel and LocalStorage (<50ms) | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 22 | TV display strictly omits customer phone numbers for privacy | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 23 | Refreshing application preserves queue entries and salon settings | `tests/acceptanceChecklist.test.ts` | **PASS** |

**Acceptance Test Summary: 23 out of 23 items passed (100% pass rate).**

---

## Technical Stack & Architecture

### Technology Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS
- **Design Tokens:** Charcoal (`#1F2937`), Restrained Gold (`#D4A017`), Warm Neutrals (`#F9FAFB`, `#F3F4F6`)
- **Touch Optimization:** Minimum 44px touch targets
- **Icons:** Lucide React (accessible SVG icons, no emojis)
- **Routing:** React Router DOM v6
- **Central Domain Logic:** `src/domain/queueRules.ts` and `src/domain/types.ts`
- **Internationalization:** English and Gujarati (`ગુજરાતી`)
  
### Real-Time Synchronization

The application uses:

- `BroadcastChannel('royal_touch_salon_sync')` for cross-tab communication.
- `localStorage` for persistent queue and settings data.

Storage keys:

- `royal_touch_salon_queue_v1`
- `royal_touch_salon_settings_v1`

### Internationalization

The application includes a complete bilingual dictionary in:

`src/i18n/translations.ts`

Features include:

- English and Gujarati language support.
- Language switcher.
- Language preference persisted in localStorage.
- Complete translation key parity.

---

## Project Structure

```text
salon-queue-management/
│
├── docs/
├── public/
├── tests/
│   └── acceptanceChecklist.test.ts
│
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   └── queueRules.ts
│   │
│   ├── context/
│   │   └── SalonContext.tsx
│   │
│   ├── i18n/
│   │   ├── index.tsx
│   │   └── translations.ts
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── JoinQueue.tsx
│   │   ├── MyStatus.tsx
│   │   ├── Reception.tsx
│   │   ├── BarberView.tsx
│   │   ├── TvDisplay.tsx
│   │   └── AdminSettings.tsx
│   │
│   └── mock/
│       └── seedData.ts
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── README.md
```

---

## Local Setup & Development

### Prerequisites

Make sure you have installed:

- Node.js >= 18
- npm >= 9
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/Heetdavariya/salon-queue-management.git
```

Navigate to the project directory:

```bash
cd salon-queue-management
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

`http://localhost:5173`

### Running Automated Tests & Linting

Run all 59 unit, domain, and acceptance tests:

```bash
npm test
```

Run the TypeScript type-checker:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

---

## Deployment Instructions

The project is structured for Single Page Application (SPA) deployment on Vercel and Netlify.

### Deploy to Vercel (Recommended)

1. Push your project to GitHub.
2. Open [Vercel](https://vercel.com/).
3. Select **Add New Project**.
4. Import your `salon-queue-management` GitHub repository.
5. Configure the following build settings:

   | Setting | Value |
   |---|---|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

6. Click **Deploy**.

The included `vercel.json` is intended to route application requests to `index.html` for React Router client-side navigation.

### Deploy to Netlify

1. Open [Netlify](https://www.netlify.com/).
2. Import your GitHub repository.
3. Configure the following:

   | Setting | Value |
   |---|---|
   | Build Command | `npm run build` |
   | Publish Directory | `dist` |

4. Configure SPA redirects using a `_redirects` file in the public directory:

```text
/*  /index.html  200
```

5. Deploy the project.

---

## Environment Variables

Refer to `.env.example` in the project root.

Example configuration:

```env
# Salon Application Port
PORT=5173

# Optional: Remote Supabase database credentials
# Required only if connecting a remote real-time backend.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Default Mode:** The application runs in self-contained local demo mode using `BroadcastChannel` for cross-tab synchronization and `localStorage` for persistent data.

---

## Important Notes

- The application supports English and Gujarati.
- Customer phone numbers are not displayed on the public TV screen.
- Queue data and salon settings are persisted in localStorage.
- Cross-tab synchronization uses BroadcastChannel.
- Online queue joining automatically closes 30 minutes before salon closing time.
- Receptionists can still add walk-in customers when online joining is closed.

---

## License

This project is developed for Royal Touch Hair Studio.

All rights reserved unless otherwise specified.
```
