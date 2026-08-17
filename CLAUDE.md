@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout warning

The git repository root is `qui-diogo/` (this directory), **not** its parent `Qui_Diogo/`. The parent directory holds a stale, untracked copy of the same scaffold (`controllers/`, `models/`, `database/`, `prisma/`, `generated/`, a second `render.yaml`, `.env`, `DEPLOY_RENDER.md`, `QUICKSTART.md`). Nothing there is deployed or version-controlled. Edit code here; treat parent-directory duplicates as dead unless deliberately reconciling them.

## Commands

Run from this directory:

```bash
npm run dev       # Next dev server on :3000
npm run build     # production build (also the TypeScript check)
npm run start     # serve the build — requires `npm run build` first
npm run lint      # eslint
npm test          # vitest, single run
npm test -- -t 'normalizes'   # single test by name

npm run db:start  # start the portable local Postgres (creates it on first run)
npm run db:stop   # stop it
npm run db:status # list tables, or report that it is stopped
npm run db:reset  # destroy the whole local cluster

npm run migrate   # apply database/migrations/*.sql in filename order
npm run seed      # apply database/seed/*.sql in filename order
npm run reset     # delete all participants/responses, keep the schema
```

`run-local.bat` chains install → db:start → migrate → seed → dev and opens the browser. It is the intended entry point for manual testing.

`migrate`/`seed`/`reset` and the app all throw at import time if `DATABASE_URL` is unset (see `lib/db.ts:20`), so `npm run dev` works without a database only until a request hits an API route.

## Base de dados local

There is no system-wide Postgres, no Docker, and no service to manage. `tools/pg-local.ps1` drives a **portable** PostgreSQL 17.6 that lives entirely outside the repository:

- binaries: `../.pgportable/pgsql/` — the official EnterpriseDB Windows x64 **binaries** zip (not the installer), extracted by hand
- data cluster: `../.pgdata/`, created by `initdb -A trust` on first `db:start`, listening on `localhost:5432` only
- server log: `../.pgdata/server.log`

Both paths are in the parent directory, which is not a git repository, so they can never be committed. If `../.pgportable` is missing (fresh clone, or another machine), re-download `postgresql-17.6-1-windows-x64-binaries.zip` from `get.enterprisedb.com/postgresql/` and extract it there — nothing else is needed, and no admin rights are required.

`.env` is already set to `postgresql://postgres:postgres@localhost:5432/qui_diogo`, which matches this cluster (`-A trust` ignores the password).

## Architecture

**Next.js 16 App Router + React 19 + TypeScript, with raw SQL over `pg`.** Prisma is vestigial: `prisma/schema.prisma`, `prisma.config.ts`, `dev.db`, and the parent's `generated/prisma/` are leftovers from an abandoned approach and are not used at runtime. The Prisma schema still describes the *correct* table shape (`Participant`/`Response`), which the SQL migrations do not — see Known issues.

**Two separate database layers, deliberately duplicated:**
- `lib/db.ts` — ESM/TypeScript, used by API routes.
- `database/index.js` — CommonJS, used by the `migrate`/`seed`/`reset` node scripts.

Both construct their own `pg.Pool` from `DATABASE_URL` and enable `ssl: { rejectUnauthorized: false }` only when `NODE_ENV === 'production'`. Changing connection behaviour means changing both.

**The quiz is data, not code.** `lib/quiz.ts` holds `quizSections` (7 sections, discriminated-union `QuestionDefinition` types: text/textarea/date/time/number/select) flattened into `allQuestions`. Adding or changing a question means editing that array and nothing else: `app/api/submit/route.ts` iterates `allQuestions` to build one `responses` row per question, denormalizing the question label into `question_text`. The seeded `questions` table is not read by the app.

Two derived lists drive the flow, both computed from a `core?: boolean` flag on each question:
- `coreQuestions` — the main path everyone walks (currently 18)
- `bonusQuestions` — offered only after the core path, on the "gate" screen (currently 9)

The list was deliberately cut from 51 questions to 27: near-duplicate "parecenças" (eyes/nose/mouth/hair each asked separately) and the long tail of "quem vai…" questions were removed because the flow read as heavy on a phone. Resist re-adding questions one at a time.

Marking a question `core: true` moves it between the two; nothing else needs touching. The section a question belongs to still supplies its header and illustration, even though sections are no longer rendered as pages.

**The quiz UI is a single scrolling form** (`app/page.tsx`) with three phases: `name → quiz → done`. All 18 core questions are on the page at once, grouped by section, with the bonus block behind an opt-in button at the bottom. Select questions use native `<select>` — on a phone that opens the OS picker and keeps the page short, which pill buttons could not (18 questions × 4–5 options is an unusable scroll).

This replaced an earlier one-question-per-screen wizard with auto-advance. Both were built and reviewed against the real thing; the single page won because the step-by-step version felt slow. Don't reintroduce per-question transitions without asking.

**"Outra" opens a free-text field.** Any select option matching `/^outr[ao]$/i` (`isOtherOption`) reveals an input instead of advancing. On submit, `resolveAnswer` stores the typed text in place of the word "Outra", so the admin sees the real answer; if nothing is typed, the literal option is stored.

**The final screen shows aggregate stats.** `GET /api/stats` returns counts only — never names or individual answers — and `lib/stats.ts` holds the aggregation as a pure function (`buildStats`) so it is unit-tested without a database. `AVERAGE_KEYS`, `DATE_KEY`, and `DISTRIBUTION_KEYS` at the top of that file control what appears; keep the list short, since the screen is a reward and not a report. Averages ignore values outside the `min`/`max` declared on the question in `lib/quiz.ts` — one person typing a length of `3.3` would otherwise wreck the mean.

`app/StatsPanel.tsx` renders it. Design constraints that were deliberate, not incidental:
- One measure, so **one bar colour** (`--chart-bar`), with the reader's own pick in `--chart-bar-mine` **plus a text badge** — identity never rests on colour alone.
- Those two hex values were picked by running the dataviz skill's `validate_palette.js`: both clear 3:1 against the white card and sit ΔE ≈ 26 apart under normal and simulated colour-vision deficiency. The softer invite blues failed (`#8fbfe3` gave 1.96:1; `#4a86c8`/`#2f6bb0` were ΔE 8.7 apart, indistinguishable).
- Every bar is direct-labelled with percent **and raw count**, because rounded percentages often sum to 99 and there is no hover on a phone.
- A question with only one distinct answer renders as a sentence, not a lone 100% bar.
- The hero figure uses the body sans, not the script face — Dancing Script numerals are hard to read at that size.

**Styling follows `Convite.jpeg`.** The palette lives in `app/globals.css` as CSS custom properties sampled from the invite; `Dancing_Script` is the display face (the invite's handwriting) and `Quicksand` the body. The illustrations in `public/convite/` are produced by `tools/recortar-convite.py`, which runs in two passes: it first turns the whole invite into `convite.png` with the off-white paper removed to real transparency (a luminance ramp — without it the cut-outs render as visible grey boxes), then crops each figure from *that* and **trims to the alpha bounding box**. The trim is what guarantees nothing renders clipped; the generous boxes at the top of the file only need to avoid catching a neighbour or the invite's dashed rules.

Because trimming changes each PNG's aspect ratio, the sizes in `page.module.css` and the `CLOTHESLINE` widths in `page.tsx` are derived from the output dimensions the script prints. Re-run the script and update those numbers together, or use a square box with `background-size: contain` (as `.sectionIcon` does) which cannot clip whatever the ratio.

`tools/palpites-demo.py` fills the database with nine fictional guesses so the stats screen can be seen with data. Development only — clear it with `npm run reset` before the party.

**Name uniqueness** is the app's one real invariant. `normalizeParticipantName` (trim → lowercase → NFD → strip combining marks → collapse whitespace) produces the `name_key` stored alongside the display name. It is checked twice: `/api/check-name` as the user advances past step 0, and again in `/api/submit` before insert (409 on collision). `isNameAllowed` exists for the in-memory/test path.

**Quiz flow** is a single client component (`app/page.tsx`) driving `stepIndex`: 0 is the name gate, 1..N are sections, N is the review step, N+1 is the success screen. All answers live in one flat `Record<string, string>` keyed by question key; nothing is persisted until final submit.

**Admin auth is a signed token.** `lib/auth.ts` issues `base64url(username:expiry).hmac-sha256` keyed on `ADMIN_SECRET` (falling back to `ADMIN_PASSWORD`), and `isAuthorizedRequest` verifies the signature with `timingSafeEqual` plus an 8-hour expiry. Every `/api/admin/*` route goes through it.

This is deliberately stronger than it was: the original token was `base64(username:timestamp)` and the participants route only checked that the bearer string was 8+ characters, so anything passed. That was tolerable while the admin was read-only; it stopped being tolerable once destructive endpoints existed. `lib/auth.test.ts` pins the behaviour, including that the old unsigned format is now rejected. **Any new destructive route must call `isAuthorizedRequest`.**

`DELETE /api/admin/participants` wipes everything; `DELETE /api/admin/participants/[id]` removes one person (used when a guest fills the quiz by mistake — deleting frees their name for reuse, since `name_key` goes with the row). Both rely on `ON DELETE CASCADE` to take the responses. In the UI, the first click only opens a confirmation dialog; nothing is deleted until it is confirmed there.

## Deployment (Render Blueprint)

Render reads `render.yaml` from the repository root — that is **this directory's** `render.yaml`, not the parent's. It provisions a free web service plus a free Postgres, injecting `DATABASE_URL` from the database and setting `NODE_ENV=production`.

## Known issues

- **The admin password still defaults to `diogo2026` in code.** The token signing is sound, but the secret is weak and public if `ADMIN_PASSWORD` is not set in the environment. Set it (and ideally `ADMIN_SECRET`) on Render before the party.
- **`migrate` re-runs every file on every invocation** — there is no migrations ledger table. Every migration must therefore stay idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). The same applies to seed files.
- **`relationship` is dead weight.** The column exists on `participants` and the admin UI renders "Sem relação definida" for every row, but the question was removed from the public quiz and `/api/submit` always inserts `null`.
