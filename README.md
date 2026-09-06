# Farm Worker Booking Platform

A localized marketplace connecting farmers (customers) with farm workers in rural areas (e.g., Nashik). The platform features role-based access, multilingual support (English & Marathi), and an Admin Dispatch model to streamline operations.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** MongoDB (via Mongoose)
- **Styling:** Tailwind CSS + custom UI components
- **Authentication:** Custom JWT + OTP-based login (Simulated SMS)
- **Localization:** React Context-based i18n (`mr.json`, `en.json`)

## Features Overview
- **Multilingual UI:** Full Marathi and English support.
- **Role-based Architecture:** Segregated logic and dashboards for Admins, Customers, and Workers.
- **Admin Dispatch Workflow:** Admins assign verified workers to incoming jobs, triggering instant SMS notifications to workers.
- **Payments Integration:** Razorpay integration for online payments + Cash on Delivery support.

For a detailed breakdown of features by role, see [FEATURES.md](./FEATURES.md).

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` (if provided) and fill in:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `MSG91_AUTH_KEY` (for SMS)
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Testing Admin Access:**
   If you need an admin account, you can run the seed script:
   ```bash
   npx ts-node --env-file=.env scripts/seed-admin.ts
   ```
   Then login with `+919527764368` (or the number you configured).

## Architecture Details
- **APIs:** All endpoints live under `/api/v1/*`.
- **Protected Routes:** Middleware and `AuthContext` protect pages like `/dashboard`, `/book`, and `/admin`.
- **Database Models:** Located in `src/lib/models/`. Uses reference-based queries to populate related documents (e.g., populating `worker_ids` in `Booking`).
