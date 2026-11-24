# Royal Touch Hair Studio — Salon Queue Management System

> **Live Demo URL**: *Ready for deployment. Run `npx vercel` or link to GitHub repository on Vercel/Netlify. (See [Deployment Instructions](#deployment-instructions) below).*
>
> ### Staff Demo Quick Navigation
> - **Reception Dashboard**: [/reception](file:///reception) (Tablet landscape layout — manage queue, add walk-ins, mark no-shows, call next)
> - **Barber Station View**: [/barber/Ravi](file:///barber/Ravi) · [/barber/Amit](file:///barber/Amit) · [/barber/Suresh](file:///barber/Suresh) (Mobile view — live service timer, Done / Start, Break toggle)
> - **Waiting Area TV Screen**: [/display](file:///display) (High-contrast landscape for 5-meter viewing, live pulse & audio chime, zero phone numbers)
> - **Owner & Salon Settings**: [/admin](file:///admin) (Edit services, on-duty toggles, queue hours, 30-min auto cutoff, daily metrics, demo data reset)
> - **Customer Join Queue**: [/join](file:///join) (Remote join, max 3 services, dynamic duration/price, 10-digit Indian phone validation)
> - **Customer Live Status**: [/status/q-active-1](file:///status/q-active-1) (Live position, estimated wait, "Start coming" alert, "It's your turn!" gold pulse banner)

---

## 23-Item Acceptance Test Results (docs/03-flows-rules.md)

| # | Acceptance Requirement | Test Suite & Method | Status |
|---|------------------------|---------------------|:------:|
| 1 | Join with two services; total duration and price equal sum | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 2 | Selecting a fourth service is prevented with clear explanation | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 3 | Invalid or incomplete phone number is rejected (10 digits) | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 4 | Duplicate phone detection links to active token without duplicate | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 5 | Customer who selected Ravi is never called by Amit | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 6 | Amit skips waiting Ravi customer and selects earliest eligible Amit/Any customer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 7 | Any-barber customer can be assigned to any available barber | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 8 | Barber with active Called/In-chair assignment cannot receive another customer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 9 | Barber on break or off-duty receives no new assignment | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 10 | Call next transitions status from WAITING to CALLED & syncs TV | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 11 | Start changes status to IN_CHAIR and initializes service timer | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 12 | Done changes status to DONE and clears active assignment across all views | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 13 | Called customer can be marked No-show after 10 min with confirmation | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 14 | No-show customer re-added as walk-in receives new token at queue tail | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 15 | Customer cancellation requires confirmation and removes active spot | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 16 | Closed online queue disables remote join but allows receptionist walk-ins | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 17 | Online joining closes automatically 30 min before closing time | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 18 | Estimated wait never displays 0 when people ahead and never divides by 0 | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 19 | Estimated wait decreases when customers finish or barbers become available | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 20 | English & Gujarati dictionaries have 100% complete parity | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 21 | Multi-tab views stay in sync via BroadcastChannel & LocalStorage (<50ms) | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 22 | TV display strictly omits customer phone numbers for privacy | `tests/acceptanceChecklist.test.ts` | **PASS** |
| 23 | Refreshing application preserves queue entries and salon settings | `tests/acceptanceChecklist.test.ts` | **PASS** |

**Summary: 23 out of 23 Acceptance Checklist Items Passed (100% Pass Rate)**

---

## Technical Stack & Architecture

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS
- **Design Tokens**: Charcoal `#1F2937`, Restrained Gold `#D4A017`, Warm Neutrals (`#F9FAFB`, `#F3F4F6`), minimum 44px touch targets
- **Icons**: Lucide React (Clean accessible SVG icons, no emojis)
- **Routing**: React Router DOM v6
- **Central Domain**: `src/domain/queueRules.ts` & `src/domain/types.ts`
- **Real-Time Cross-Tab Synchronization**: `BroadcastChannel('royal_touch_salon_sync')` backed by `localStorage` persistence (`royal_touch_salon_queue_v1` and `royal_touch_salon_settings_v1`)
- **Internationalization**: Complete bilingual dictionary (`src/i18n/translations.ts`) for English and Gujarati (ગુજરાતી) with language switcher persisted in localStorage.

```
src/
├── domain/            # Pure centralized queue domain logic & types
│   ├── types.ts       # QueueEntry, Barber, Service, SalonSettings, etc.
│   └── queueRules.ts  # FCFS algorithm, wait time calculation, validation, transitions
├── context/
│   └── SalonContext.tsx # Central store with BroadcastChannel & LocalStorage sync
├── i18n/
│   ├── index.tsx      # Language provider hook & context
│   └── translations.ts# Full English/Gujarati bilingual dictionary (100% key parity)
├── pages/
│   ├── Home.tsx          # Route / : Salon landing, status summary, live queue preview
│   ├── JoinQueue.tsx     # Route /join : Customer remote join, max 3 services, phone validation
│   ├── MyStatus.tsx      # Route /status/:id : Real-time status, "Start coming", "It's your turn!"
│   ├── Reception.tsx     # Route /reception : 3-barber stations, active timer, Call Next, Walk-in modal
│   ├── BarberView.tsx    # Route /barber/:name : Live chair timer, Start/Done, Break toggle
│   ├── TvDisplay.tsx     # Route /display : 5-meter landscape screen, audio chime, zero phone numbers
│   └── AdminSettings.tsx # Route /admin : Services catalog, on-duty toggles, closing time, metrics
└── mock/
    └── seedData.ts       # Realistic Indian seed data (Ravi, Amit, Suresh; ₹ INR prices)
```

---

## Local Setup & Development

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Installation
```bash
# Clone or navigate to the project directory
cd salon

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Tests & Linting
```bash
# Run all 59 unit, domain, and acceptance tests
npm test

# Run TypeScript type-checker
npm run lint

# Run production build
npm run build
```

---

## Deployment Instructions

The project is structured with production SPA routing ready for deployment on Vercel, Netlify, or GitHub Pages.

### Deploy to Vercel (Recommended)
1. Push the code to a GitHub repository or use the Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. The included [vercel.json](file:///c:/Users/HEET/Desktop/salon/vercel.json) automatically routes all requests (`/(.*)`) to `/index.html` for client-side routing.

### Deploy to Netlify
1. Connect repository in Netlify or run `netlify deploy --prod --dir=dist`.
2. Ensure redirects are configured (an `_redirects` file with `/*  /index.html  200`).

---

## Environment Variables

See [.env.example](file:///c:/Users/HEET/Desktop/salon/.env.example) for variable configurations:
```env
# Salon Application Port
PORT=5173

# Optional: Remote Supabase database credentials (if connecting remote real-time backend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
*(By default, the application runs in self-contained local demo mode with zero-latency cross-tab synchronization via `BroadcastChannel` and persistent `localStorage`).*
#   s a l o n - q u e u e - m a n a g e m e n t  
 