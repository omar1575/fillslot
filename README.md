# Fillslot

Too Good To Go for leftover padel court time. First city: Maastricht. First club: Plaza Padel.

Built for a MAIN (Maastricht AI & Tech Network) hackathon at SBE, Maastricht University.

Clubs list empty hours at a discount. Players pay in advance (iDEAL or card). Fillslot takes 15% commission.

## Local

```bash
cp .env.example .env.local
# set AUTH_SECRET (openssl rand -base64 32)

npm install
npm run db:generate   # already committed after first run
npm run dev
```

Without `DATABASE_URL`, local development uses in-memory PGlite Postgres and seeds Plaza Padel on boot. Data resets when the dev server restarts. For a persistent database, point `DATABASE_URL` at Neon or any Postgres instance.

Open [http://localhost:3000](http://localhost:3000). On `/login`, local demo buttons sign in as:

- player@fillslot.test
- club@plazapadel.test
- admin@fillslot.test

Without Stripe keys, booking confirms immediately (dev path). With `STRIPE_SECRET_KEY`, Checkout uses iDEAL + cards and Connect destination charges when the club has finished onboarding.

## Neon / Vercel

Set `DATABASE_URL` to a Neon Postgres URL, run `npm run db:generate && npm run db:migrate && npm run db:seed`, and add the Auth, Stripe, and Resend secrets listed in `.env.example`.
