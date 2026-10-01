# SAMS — Smart Apartment Management System

A polished, month-based apartment expense manager for shared households. SAMS tracks roommate profiles, rent, groceries/household purchases, electricity and water bills, historical months, analytics, and end-of-month roommate settlements.

## What it does

- Shared-password access for the household (no public sign-up)
- Resident profiles with name, nationality, phone, join date and move-out/archive date
- Fixed rent per active resident (default: **€150/month**)
- Grocery / household / other shared expenses with purchaser, price and optional note
- Automatic purchase timestamp in the apartment timezone (`Europe/Rome`)
- Electricity and water bills with billing-period start/end dates
- Utility proration when a bill spans more than one month
- Optional “paid by” roommate for utility bills so SAMS can include the bill in roommate settlements
- Month selector and complete previous-month history
- Dashboard totals, trends and per-person contribution charts
- Settlement suggestions showing who should pay whom for already-paid shared costs
- Responsive desktop/mobile interface

## Accounting model

For a selected month, every resident whose membership overlaps that month is a participant.

- **Rent:** fixed amount per participant (default €150), treated as an external landlord obligation.
- **Groceries/house expenses:** equally shared by all participants. The purchaser receives credit for what they paid.
- **Utilities:** the bill is prorated by calendar-day overlap with the selected month, then divided equally. If a resident is selected as `paid by`, the prorated amount also enters internal roommate settlement. If not, it remains an unpaid/external household obligation.
- **Settlement:** only already-paid shared costs are netted between roommates, so total internal balances always sum to zero.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Set:

```env
DATABASE_URL=postgresql://...
HOUSEHOLD_PASSWORD=your-shared-password
AUTH_SECRET=your-long-random-secret
```

Generate a good signing secret with:

```bash
openssl rand -base64 48
```

Create the database tables:

```bash
npm run db:migrate
```

Run SAMS:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel + database

1. Import this GitHub repository into Vercel.
2. In the Vercel project, add a **Neon Postgres** database from the Marketplace/Storage area. Vercel/Neon supplies `DATABASE_URL`.
3. Add `HOUSEHOLD_PASSWORD` and `AUTH_SECRET` as Vercel environment variables for Production (and Preview if desired).
4. Deploy. The `vercel-build` script runs the idempotent database migration before the Next.js build.
5. Log in with the shared apartment password and create the six resident profiles.

The application never stores the shared password in the database or sends it to the browser after login. It uses a signed, HTTP-only cookie.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run db:migrate
```

## Stack

- Next.js App Router + TypeScript
- React
- Neon serverless PostgreSQL (`DATABASE_URL`)
- Recharts for analytics
- Lucide icons
- Plain responsive CSS (no UI framework lock-in)

