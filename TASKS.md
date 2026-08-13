# TASKS.md — implementation checklist

Source of truth: `AGENTS.md` (contract) + `Worker_Booking_Platform_SRS.docx` (full spec).
Each task has a **Definition of Done (DoD)** — the agent must satisfy the DoD
before checking a task off. Work top to bottom within a phase; phases are
sequential.

Format: `- [ ] TASK-ID: description` — flip to `- [x]` only after DoD passes.

---

## Phase 1 — MVP (booking flow)

- [x] P1-1: Project scaffold — Next.js app router, Mongoose/Prisma connected to
      free-tier DB, env config, base folder structure per AGENTS.md.
      **DoD:** `npm run build` succeeds; app boots locally; DB connection verified.

- [ ] P1-2: Auth — POST /api/v1/auth/otp/request, /otp/verify, /auth/refresh.
      **DoD:** OTP request is rate-limited (5/hr/mobile); verify creates a User
      on first use and returns JWT + refresh token; unit tests for both routes pass.

- [ ] P1-3: Worker self-registration — POST /api/v1/workers/register,
      GET/PATCH /workers/me, POST /uploads/sign.
      **DoD:** registering sets registration_status=pending_review,
      is_verified=false; signed upload URL issued, never raw bytes through API;
      tests cover a rejected (unauthenticated) request and a success case.

- [ ] P1-4: Admin worker approval — GET /admin/workers/pending,
      POST /admin/workers/:id/approve|reject.
      **DoD:** approving flips is_verified=true and the worker becomes visible
      in GET /workers; rejection is recorded with a reason.

- [ ] P1-5: Process/service category list — seed data for the 6 grape-farming
      tasks (EN + Marathi), admin CRUD.
      **DoD:** categories are DB-driven, not hardcoded in frontend code.

- [ ] P1-6: Booking creation — POST /bookings, GET /bookings, GET /bookings/:id.
      **DoD:** booking requires farm_size_acres, processes[], scheduled_date,
      location, payment_method; status starts at `pending` (or
      `awaiting_cash_confirmation` if payment_method = cash_advance).

- [ ] P1-7: Booking lifecycle — accept / decline / complete routes.
      **DoD:** status transitions match the state machine in AGENTS.md exactly;
      invalid transitions (e.g. completing a pending booking) are rejected.

- [ ] P1-8: Customer + worker UI — homepage (native language), booking form,
      worker dashboard, status tracking screens.
      **DoD:** mobile-responsive; homepage loads under 3s on throttled 4G in
      a Lighthouse run.

---

## Phase 2 — Transactions (payments, trust)

- [ ] P2-1: Online payment — POST /payments/initiate (Razorpay order + UPI QR
      payload), POST /payments/webhook.
      **DoD:** webhook verifies Razorpay signature and is idempotent (dedupes
      on event ID — write a test that sends the same event twice and asserts
      only one state change); QR code renders in the UI.

- [ ] P2-2: Cash confirmation — POST /payments/:id/confirm-cash.
      **DoD:** works for both cash_after_work and cash_advance; for
      cash_advance it also flips Booking status from
      awaiting_cash_confirmation → accepted; only worker or admin roles can
      call it (test an unauthorized customer call is rejected).

- [ ] P2-3: Ratings and reviews — POST /bookings/:id/review.
      **DoD:** only callable after status=completed; average_rating on
      WorkerProfile recomputes correctly (add a test with 3 reviews).

- [ ] P2-4: Notifications — SMS/app notifications for request, acceptance,
      payment confirmation, completion.
      **DoD:** each event in the lifecycle triggers exactly one notification;
      no duplicate sends on retry.

---

## Phase 3 — Growth

- [ ] P3-1: Admin reports — bookings/day, active workers, revenue by
      payment method.
      **DoD:** numbers match a manually-computed sample dataset.

- [ ] P3-2: Multi-crop/task categories — admin can add categories beyond the
      initial 6 without a code deploy.
      **DoD:** new category appears in customer booking form without a redeploy.

- [ ] P3-3: Expanded service areas — location matching beyond single district.
      **DoD:** matching logic still returns correct nearest-worker results at
      wider radius; performance stays under the 3s budget.

---

## How to use this file (for the agent)

1. Read `AGENTS.md` and the SRS before touching any task — they're the contract.
2. Find the first unchecked `- [ ]` task, top to bottom, respecting phase order.
3. Implement it.
4. Run the task's DoD checks (tests, build, lint, and — where noted — a
   browser walkthrough).
5. Only if every DoD check passes: check the box (`- [x]`), commit with a
   message referencing the task ID (e.g. `P1-3: worker self-registration API`).
6. If a DoD check fails: fix and re-run verification — do not check the box
   or move to the next task.
7. Repeat from step 2 until the phase is complete, then stop and summarize
   what was built before starting the next phase.
