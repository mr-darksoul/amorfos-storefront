# Weekly Journal routine (scheduled automation)

This is the spec for the scheduled agent that keeps the Journal fed. It runs
**weekly** and only ever produces **drafts** — publishing stays a manual step in
`/admin/journal`.

## What the routine does

1. `cd web && BATCH=2 npm run content:draft`
   - Drafts the next 2 calendar entries not yet in the `articles` table.
   - Uses the Claude API when `ANTHROPIC_API_KEY` is set, else the offline
     scaffold. Validates schema + runs the banned-phrase compliance check before
     inserting each draft with `status='draft'`.
2. Notify Manav that N drafts await review at `https://amorfos.in/admin/journal`
   (WhatsApp `+91 83684 69332` / email `care@amorfos.in`).
3. If the calendar is exhausted, the script says so — top up
   `scripts/content-calendar.json` with new entries (see
   `docs/content-marketing-strategy.md` §4–5 for the topic backlog).

## Required environment

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required to insert drafts),
`ANTHROPIC_API_KEY` (optional, enables full LLM drafts), `CONTENT_MODEL`
(optional, default `claude-sonnet-4-6`).

## How to register it

Use the `/schedule` Claude Code skill (cloud routine), cadence **weekly**, with a
prompt along the lines of:

> In the Amorfos `web` repo, run `BATCH=2 npm run content:draft`, then tell me how
> many Journal drafts were created and remind me to review them at
> /admin/journal. Do not publish anything.

Alternative (fully hands-off, deferred): a Vercel Cron hitting a protected API
route that calls the Claude API directly. Not built — the routine above keeps a
human in the approval loop, which is the chosen design.
