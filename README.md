# Fillslot

Too Good To Go for leftover hours and leftover tickets. First city: Maastricht.

Padel, hair, spa, bowling, cinema, and stadium surplus — clubs and venues dump empty windows or unsold tickets at a discount.

Built for a MAIN (Maastricht AI & Tech Network) hackathon at SBE, Maastricht University.

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

```bash
cp .env.example .env.local
# set AUTH_SECRET (openssl rand -base64 32)

npm install
npm run db:generate   # already committed after first run
npm run dev
```

Without `DATABASE_URL`, local development uses in-memory PGlite Postgres and seeds the six Maastricht demo venues on boot. Data resets when the dev server restarts. For a persistent database, point `DATABASE_URL` at Neon or any Postgres instance.

Open [http://localhost:3000](http://localhost:3000). On `/login`, local demo buttons sign in as the player, each demo partner, or admin.

Without Stripe keys, booking confirms immediately (dev path). With `STRIPE_SECRET_KEY`, Checkout uses iDEAL + cards and Connect destination charges when the venue has finished onboarding.

## Neon / Vercel

Set `DATABASE_URL` to a Neon Postgres URL, run `npm run db:generate && npm run db:migrate && npm run db:seed`, and add the Auth, Stripe, and Resend secrets listed in `.env.example`.
