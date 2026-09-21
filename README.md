# Fillslot

Too Good To Go for leftover hours and leftover tickets. First city: Maastricht.

Padel, hair, spa, bowling, cinema, and stadium surplus — clubs and venues dump empty windows or unsold tickets at a discount.

Built for a MAIN (Maastricht AI & Tech Network) hackathon at SBE, Maastricht University.

**Stack:** Next.js, Drizzle, Supabase Auth + Postgres, Stripe (iDEAL + cards). Sign in with email and password. Google and Apple come later.

## Working together (two Cursor users)

Repo: [github.com/omar1575/fillslot](https://github.com/omar1575/fillslot)

1. Get invited as a collaborator, then `git clone git@github.com:omar1575/fillslot.git` and open that folder in Cursor (not a parent directory).
2. Before you or your agent writes code: `git pull --rebase origin main`, then branch `yourname/topic`.
3. Push often. Do not both edit `src/db/schema.ts`, `src/auth.ts`, `package.json`, or `src/app/globals.css` at the same time.
4. Cursor agents in this repo automatically load `.cursor/rules/collaboration.mdc`.

Suggested split for speed: one person owns **consumer** (`/`, `/deals`, `/bookings`, `/login`), the other owns **club + payments** (`/club`, Stripe, schema, seed).

Venues list empty hours or leftover tickets at a discount. Guests pay in advance (iDEAL or card). Fillslot takes 15% commission.

Exclusive listings (padel, hair, spa, bowling) are one resource for one time window. Cinema and stadium listings sell leftover tickets with quantity.

## Local

1. Create a Supabase project.
2. In Authentication: set Site URL to `http://localhost:3000` and add redirect `http://localhost:3000/auth/callback`.
3. Enable Email (email + password). Google and Apple can wait.
4. Copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (transaction pooler, port 6543), and `DIRECT_URL` (session pooler, port 5432).

```bash
cp .env.example .env.local
npm install
npm run db:generate   # already committed after first run
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/login` is email and password. In development, demo buttons sign in the seeded player, partners, and admin (password `fillslot-dev-local` unless you set `DEV_LOGIN_PASSWORD`).

Without Stripe keys, booking confirms immediately (dev path). With `STRIPE_SECRET_KEY`, Checkout uses iDEAL + cards and Connect destination charges when the venue has finished onboarding.

## Vercel

Point `DATABASE_URL` at the Supabase pooler, `DIRECT_URL` at the direct Postgres URL, run `npm run db:migrate && npm run db:seed`, and add the Supabase and Stripe secrets listed in `.env.example`. Add the production URL to Supabase Auth redirect URLs.
