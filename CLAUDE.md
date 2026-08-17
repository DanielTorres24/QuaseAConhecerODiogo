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

`migrate`/`seed`/`reset` throw at import time if `DATABASE_URL` is unset — they exist to talk to the database, so failing loudly is right. The app does **not**: `lib/db.ts` builds its pool on the first query, not on import. That is deliberate. `next build` imports every route to analyse it, so connecting at import time made the whole build fail when `DATABASE_URL` was absent, with an error that pointed nowhere near the cause. Keep the pool lazy.

## Base de dados local

There is no system-wide Postgres, no Docker, and no service to manage. `tools/pg-local.ps1` drives a **portable** PostgreSQL 17.6 that lives entirely outside the repository:

- binaries: `../.pgportable/pgsql/` — the official EnterpriseDB Windows x64 **binaries** zip (not the installer), extracted by hand
- data cluster: `../.pgdata/`, created by `initdb -A trust` on first `db:start`, listening on `localhost:5432` only
- server log: `../.pgdata/server.log`

Both paths are in the parent directory, which is not a git repository, so they can never be committed. If `../.pgportable` is missing (fresh clone, or another machine), re-download `postgresql-17.6-1-windows-x64-binaries.zip` from `get.enterprisedb.com/postgresql/` and extract it there — nothing else is needed, and no admin rights are required.

`.env` is already set to `postgresql://postgres:postgres@localhost:5432/qui_diogo`, which matches this cluster (`-A trust` ignores the password).

## Architecture

**Next.js 16 App Router + React 19 + TypeScript, with raw SQL over `pg`.** There is no ORM. Prisma was abandoned early and its leftovers (`prisma.config.ts`, `prisma/schema.prisma`, `dev.db`) were deleted after `prisma.config.ts` broke a Render deploy: it imported `prisma/config`, which is not a dependency. Local builds passed because `incremental: true` plus a stale `tsconfig.tsbuildinfo` skipped re-checking the unchanged file; Render builds from scratch and caught it. **To reproduce a Render build locally, delete `tsconfig.tsbuildinfo` and `.next` first** — otherwise the cache can hide type errors in files you have not touched.

**Two separate database layers, deliberately duplicated:**
- `lib/db.ts` — ESM/TypeScript, used by API routes.
- `database/index.js` — CommonJS, used by the `migrate`/`seed`/`reset` node scripts.

Both construct their own `pg.Pool` from `DATABASE_URL` and enable `ssl: { rejectUnauthorized: false }` only when `NODE_ENV === 'production'`. Changing connection behaviour means changing both.

**The quiz is data, not code.** `lib/quiz.ts` holds `quizSections` (7 sections, discriminated-union `QuestionDefinition` types: text/textarea/date/time/number/select) flattened into `allQuestions`. Adding or changing a question means editing that array and nothing else: `app/api/submit/route.ts` iterates `allQuestions` to build one `responses` row per question, denormalizing the question label into `question_text`. The seeded `questions` table is not read by the app.

`allQuestions` is the whole flow — every one of the 27 is asked, in order, with no split and no opt-in step. An earlier `core`/`bonus` division existed and was removed; don't reintroduce a "want more questions?" gate.

The list was deliberately cut from 51 questions to 27: near-duplicate "parecenças" (eyes/nose/mouth/hair each asked separately) and the long tail of "quem vai…" questions were removed because the flow read as heavy on a phone. Resist re-adding questions one at a time.

Marking a question `core: true` moves it between the two; nothing else needs touching. The section a question belongs to still supplies its header and illustration, even though sections are no longer rendered as pages.

**The quiz UI asks one question per screen** (`app/page.tsx`), phases `name → quiz → done`, walking `allQuestions` from 1/27 to 27/27 and submitting straight from the last one. Nothing interrupts the sequence.

With a screen to itself, each choice question gets large tappable buttons rather than a native `<select>`. **Tapping an option only records it — advancing is always an explicit "Continuar".** Two earlier versions advanced on tap (one after a ~260 ms pause, one instantly); both were rejected, because you cannot change your mind and a stray tap costs you a question. Keep the two actions separate.

"Continuar" is therefore always rendered, never conditional on having answered — it is the single way forward, and a button that appears only after answering would jump under the reader's thumb at the moment they aim for it. There is no "Saltar": every question is optional, so continuing with a blank answer *is* skipping, and a second forward button competing with the first was the confusion worth removing. A quiet "Podes deixar em branco." sits next to Voltar while the question is unanswered.

The nav is two fixed rows (primary full-width on top, Voltar under it) rather than one flex row. On a 320 px screen the single row wrapped and left the primary button stranded mid-line.

This layout has flipped twice on request — one-per-screen, then a single scrolling form, now one-per-screen again. Confirm before changing it a fourth time.

**"Outra" opens a free-text field.** Any select option matching `/^outr[ao]$/i` (`isOtherOption`) reveals an input instead of advancing. On submit, `resolveAnswer` stores the typed text in place of the word "Outra", so the admin sees the real answer; if nothing is typed, the literal option is stored.

**The final screen shows aggregate stats.** `GET /api/stats` returns counts only — never names or individual answers — and `lib/stats.ts` holds the aggregation as a pure function (`buildStats`) so it is unit-tested without a database. `AVERAGE_KEYS`, `DATE_KEY`, and `DISTRIBUTION_KEYS` at the top of that file control what appears; keep the list short, since the screen is a reward and not a report. Averages ignore values outside the `min`/`max` declared on the question in `lib/quiz.ts` — one person typing a length of `3.3` would otherwise wreck the mean.

`app/StatsPanel.tsx` renders it. Design constraints that were deliberate, not incidental:
- One measure, so **one bar colour** (`--chart-bar`), with the reader's own pick in `--chart-bar-mine` **plus a text badge** — identity never rests on colour alone.
- Those two hex values were picked by running the dataviz skill's `validate_palette.js`: both clear 3:1 against the white card and sit ΔE ≈ 26 apart under normal and simulated colour-vision deficiency. The softer invite blues failed (`#8fbfe3` gave 1.96:1; `#4a86c8`/`#2f6bb0` were ΔE 8.7 apart, indistinguishable).
- Every bar is direct-labelled with percent **and raw count**, because rounded percentages often sum to 99 and there is no hover on a phone.
- A question with only one distinct answer renders as a sentence, not a lone 100% bar.
- The hero figure uses the body sans, not the script face — Dancing Script numerals are hard to read at that size.

**Two typefaces, with a rule.** `Dancing_Script` (`--font-script`) is for titles only; `Quicksand` (`--font-body`) carries everything else, including every number. Script numerals are unreadable at a glance, so the stats hero and all figures stay on the body face.

**Everything is fluid — there is no fixed-px layout.** `app/globals.css` defines a `clamp()` scale (`--text-xs` … `--text-2xl`, `--space-2` … `--space-6`, `--radius`, `--tap`) that interpolates between a 320 px phone and a tablet, and every rule in the app sizes itself from those tokens. That is why there is almost no media query: adding one usually means a token is wrong. Two floors are deliberate and should not be lowered — `--text-xs` at ~12.6 px (below that the stat-tile captions stop being comfortable) and `font-size: max(16px, …)` on `.field` (anything smaller makes Safari on iPhone zoom on focus). `* { min-width: 0 }` in the reset keeps a long word from widening the page.

Verify changes at 320/360/390/430/768 and assert `documentElement.scrollWidth === clientWidth` at each; horizontal overflow is the failure this layout is built to avoid.

**The illustrations come from `icons.png`** (project root, one sheet of five objects on a dark background) via `tools/recortar-icones.py`, which writes `public/icons/`. Background removal grows a region inward from the tile borders, accepting the next pixel while the colour barely changes — it follows the smooth gradient and stops at the silhouette, and dark areas *inside* an object survive because they never touch the border. A plain luminance cut fails here (the cap and sneakers are navy, like the background) and so does GrabCut (it eats the bunny's bow tie and misses the bodysuit entirely).

`TOLERANCIA` is per object because the safe value differs wildly: sweep it and the background fraction holds steady, then jumps — the jump is the fill bursting into the object. Each value sits just below its own jump. The bunny needs 18 (beige fur against a warm glow) and the cap only 10 (navy on navy); the rest take 26. If a cut-out looks nibbled, lower its tolerance; if a dark halo survives, raise it.

Aspect ratios matter downstream: `BONECOS` in `page.tsx` passes each PNG's width/height as a `--ratio` custom property and the CSS derives width from a fluid height, so nothing is ever stretched or clipped. Re-running the script can change those dimensions — update the ratios from the sizes it prints. `.sectionIcon` sidesteps this with a square box and `background-size: contain`, which cannot clip at any ratio.

The page background (watercolour gradients plus scattered hearts) is pure CSS, so it costs no requests and scales to any screen.

`tools/palpites-demo.py` fills the database with nine fictional guesses so the stats screen can be seen with data. Development only — clear it with `npm run reset` before the party.

**Name uniqueness** is the app's one real invariant. `normalizeParticipantName` (trim → lowercase → NFD → strip combining marks → collapse whitespace) produces the `name_key` stored alongside the display name. It is checked twice: `/api/check-name` as the user advances past step 0, and again in `/api/submit` before insert (409 on collision). `isNameAllowed` exists for the in-memory/test path.

**Quiz flow** is a single client component (`app/page.tsx`) driving `stepIndex`: 0 is the name gate, 1..N are sections, N is the review step, N+1 is the success screen. All answers live in one flat `Record<string, string>` keyed by question key; nothing is persisted until final submit.

**Admin auth is a signed token.** `lib/auth.ts` issues `base64url(username:expiry).hmac-sha256` keyed on `ADMIN_SECRET` (falling back to `ADMIN_PASSWORD`), and `isAuthorizedRequest` verifies the signature with `timingSafeEqual` plus an 8-hour expiry. Every `/api/admin/*` route goes through it.

This is deliberately stronger than it was: the original token was `base64(username:timestamp)` and the participants route only checked that the bearer string was 8+ characters, so anything passed. That was tolerable while the admin was read-only; it stopped being tolerable once destructive endpoints existed. `lib/auth.test.ts` pins the behaviour, including that the old unsigned format is now rejected. **Any new destructive route must call `isAuthorizedRequest`.**

`DELETE /api/admin/participants` wipes everything; `DELETE /api/admin/participants/[id]` removes one person (used when a guest fills the quiz by mistake — deleting frees their name for reuse, since `name_key` goes with the row). Both rely on `ON DELETE CASCADE` to take the responses. In the UI, the first click only opens a confirmation dialog; nothing is deleted until it is confirmed there.

## Deployment (Render Blueprint)

Render reads `render.yaml` from the repository root — that is **this directory's** `render.yaml`, not the parent's. It provisions a free web service plus a free Postgres, injecting `DATABASE_URL` from the database.

**`render.yaml` only applies to services created as a Blueprint.** A service created by hand through "New → Web Service" keeps whatever is typed in the dashboard and ignores this file entirely — which is how a deploy once ran `npm install; npm run build` with no migrations. If the dashboard and this file disagree, the dashboard is what ran.

The split of work is deliberate:
- **build** — `npm install && npm run build`. Touches no database, so a connection problem can never fail a compile.
- **start** — `npm run migrate && npm run start`. Migrations run at boot; they are idempotent (`CREATE ... IF NOT EXISTS`), so every restart re-applying them is harmless. Any new migration must keep that property.

`npm run seed` is not run on Render: the only seed file is a documented no-op, since questions live in `lib/quiz.ts`.

**Diagnosing a broken deploy without the logs:** `GET /api/health` is deliberately database-free and always 200, because it is the `healthCheckPath` and the free Postgres sleeping must not kill the service. `GET /api/health?db=1` is the diagnostic — it returns `sem-configuracao`, `sem-tabelas` (Postgres `42P01`, meaning migrations never ran), `sem-ligacao`, or `ok` with row counts.

That endpoint exists because of a real failure: the live site answered "Não foi possível verificar o nome" for every guest. The cause was that the tables did not exist, but it was invisible — `/api/check-name` had no `try/catch`, so the driver error escaped, Next returned an **empty** 500, `response.json()` threw in the browser, and the client fell into its generic network-error branch. Two rules came out of it: **every route that touches the database wraps it in `try/catch`** and returns JSON, and **the client checks `response.ok` and tolerates a non-JSON body** — otherwise a server fault is misreported to the user as their own connection problem.

Auto-deploy on push to `master` needs the GitHub repository properly connected to Render. A build log saying *"It looks like we don't have access to your repo, but we'll try to clone it anyway"* means it is not — the clone still works for a public repo, but no webhook arrives, so pushes will not trigger anything.

## Known issues

- **The admin password still defaults to `diogo2026` in code.** The token signing is sound, but the secret is weak and public if `ADMIN_PASSWORD` is not set in the environment. Set it (and ideally `ADMIN_SECRET`) on Render before the party.
- **`migrate` re-runs every file on every invocation** — there is no migrations ledger table. Every migration must therefore stay idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). The same applies to seed files.
- **`relationship` is dead weight.** The column exists on `participants` and the admin UI renders "Sem relação definida" for every row, but the question was removed from the public quiz and `/api/submit` always inserts `null`.
