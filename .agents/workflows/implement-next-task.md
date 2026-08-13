---
name: implement-next-task
description: Read the spec, find the next unchecked task in TASKS.md, implement it, verify it, check it off, and move to the next one — repeating until the phase is done or a task needs human input.
---

# Implement next task (autonomous loop)

Follow these steps in order. Do not skip verification. Do not check off a
task that fails verification.

## 1. Load context
- Read `AGENTS.md` in full — it is the contract for stack, schema, API
  routes, and constraints. Do not contradict it.
- If a task references SRS detail not covered in AGENTS.md, read the
  relevant section of `Worker_Booking_Platform_SRS.docx` (use pandoc or the
  docx tooling available — do not guess at requirements).
- Read `TASKS.md`.

## 2. Select the task
- Find the first line matching `- [ ] <ID>:` from the top of the current
  phase. Phases are sequential — do not start a Phase 2 task while any
  Phase 1 task is unchecked, unless the user explicitly says to skip ahead.
- If the task is ambiguous or its DoD can't be satisfied without a decision
  only the user can make (e.g. choosing between two equally valid designs
  with real tradeoffs), stop and ask — do not guess and mark it done.

## 3. Implement
- Make the change following AGENTS.md conventions exactly (route prefixes,
  response envelope, state machine, auth checks).
- Keep the change scoped to this task only — do not bundle unrelated fixes
  into the same commit.

## 4. Verify (this is the auto-check step)
Run, in order, stopping at the first failure:
1. `npm run build` (or equivalent) — must succeed.
2. `npm run lint` — must pass with no new warnings introduced by this change.
3. Task-specific tests (unit/integration) — write them if they don't exist
   yet for this route/feature, then run them.
4. If the task's DoD in TASKS.md mentions a UI or end-to-end behavior, use
   the browser tool to walk through it and confirm visually — don't just
   assume the code is correct because it compiles.

If any check fails: fix the issue and re-run step 4 from the top. Do not
proceed to step 5 until all checks pass.

## 5. Close out the task
- Edit `TASKS.md`: change `- [ ]` to `- [x]` for this task only.
- Commit with message `<TASK-ID>: <short description>`.
- Produce a short walkthrough artifact summarizing what changed and how it
  was verified.

## 6. Loop or stop
- If more unchecked tasks remain in the current phase, go back to step 2
  and repeat automatically.
- If the phase is complete, stop, summarize the whole phase, and wait for
  the user before starting the next phase.
- If you had to stop early (ambiguous task, failing check you couldn't
  resolve after 2 attempts), stop and report exactly where and why — don't
  silently skip the task.
