# Rathi Atithi Bhawan — Customer Site

The public-facing website for **Rathi Atithi Bhawan**, Vrindavan. Static Next.js site that talks to Supabase directly for room availability, bookings, and inquiries.

## Stack

- **Next.js 14** (static export, `output: 'export'`)
- **Tailwind CSS** with the same saffron palette as the admin dashboard
- **Supabase JS** — uses public RPCs (`get_available_rooms`, `create_booking`, `get_booking_by_code`) and the `inquiries` table
- Deployed to **GitHub Pages** with a **Hostinger** custom domain

## What's in the box

| Page | Path | Purpose |
|------|------|---------|
| Landing | `/` | Hero, about, room types, amenities, contact form |
| Booking | `/book` | Multi-step wizard (dates → rooms → details → review → confirmation) |
| Guest portal | `/my-booking` | Look up an existing booking by code + phone |

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

Output goes to `out/`. That's what's deployed to GitHub Pages.

## Deployment (first-time setup)

1. **Create a new GitHub repo** named `rathi-atithi-customer` (or any name — the repo name matters only if you don't use a custom domain).
2. **Push this code** to the `main` branch.
3. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Under "Source", choose **GitHub Actions**
4. **First deploy** runs automatically on push to `main`. Watch the Actions tab.

After the first successful run, your site is live at `https://<username>.github.io/<repo-name>/` (or your custom domain — see below).

## Custom domain (Hostinger)

1. **In Hostinger DNS panel**, add these records:
   - Type: `CNAME`, Name: `www`, Value: `<your-github-username>.github.io`
   - Type: `A`, Name: `@`, Value: `185.199.108.153` (GitHub Pages IP — 4 A records, see [docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site))
2. **Edit `public/CNAME`** in this repo. Put your domain (e.g. `rathiatithibhawan.com`) on a single line. Commit and push.
3. **In GitHub repo Settings → Pages**, enter your custom domain. Wait for DNS check (a few minutes to an hour). Enable "Enforce HTTPS" once available.

## Subdirectory deployment (no custom domain)

If you deploy to `https://<username>.github.io/rathi-atithi-customer/` without a custom domain, edit `next.config.js` and **uncomment** the `basePath` line. Otherwise all asset paths break.

## Environment variables

Supabase URL and anon key are baked into `lib/supabase.ts` as defaults. They're public values (anon key is meant to be exposed; RLS in the database restricts what callers can do). Override at build time if you ever rotate the project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
npm run build
```

Or set them as repo secrets and reference in `.github/workflows/deploy.yml`.

## Hardcoded contact info

The site footer has placeholder phone/email/WhatsApp in `components/site-footer.tsx`. Update those to the real numbers once provided. (A future enhancement could fetch from the `settings` table at runtime.)

## How it talks to the database

All calls go through the Supabase JS client with the anon key:

- **Room availability** → `supabase.rpc("get_available_rooms", { p_check_in, p_check_out })`
- **Create booking** → `supabase.rpc("create_booking", { ... })` — bookings start as `pending`; admin confirms in the dashboard
- **Lookup booking** → `supabase.rpc("get_booking_by_code", { p_booking_code, p_phone })` — requires both for privacy
- **Contact form** → `supabase.from("inquiries").insert(...)` — public insert allowed by RLS

No payment integration. Customers pay at the hotel (cash / UPI / bank). The admin records payments manually in the dashboard ledger.

## What's NOT here yet

- Individual room detail pages (`/rooms/[id]`)
- Image gallery
- Reviews / testimonials
- Multilingual (Hindi)
- Map embed

All easy adds for a later iteration.
