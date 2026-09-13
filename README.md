# Sankareshwari Silvers — upgraded full website

This version includes:
- Silver-themed customer storefront with scroll reveal / roll-style motion.
- Live price formula: **weight × latest silver rate + making charge**.
- Product image, weight, price, stock pieces and stock grams on customer cards.
- Automatic **Out of stock** state when piece or gram stock reaches zero.
- Cart and checkout; checkout requires login.
- Supabase OAuth buttons for Google, Apple and GitHub.
- Razorpay order creation + server-side signature verification.
- Stock reduction after verified payment.
- Customer order history.
- Fast page-based admin area instead of one huge page.
- Separate admin pages for dashboard, categories, products, add/edit product, silver rate history and orders.

## Setup

1. Copy the root configuration files from your existing project (`package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `.env.example`, `.gitignore`, `next-env.d.ts`) into this folder if they are not already present.
2. Run `supabase/schema.sql` in Supabase SQL Editor. If your old schema already has tables with conflicting columns, compare/migrate instead of blindly running it in production.
3. Create a **public** Supabase Storage bucket named `product-images`.
4. Configure Supabase Authentication providers:
   - Google
   - Apple
   - GitHub (optional third provider)
5. Add allowed redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://YOUR-DOMAIN/auth/callback`
6. Put your real values in `.env.local`.
7. Login once, then add your user to `admin_users` using the SQL comment at the bottom of `supabase/schema.sql`.
8. `npm install`
9. `npm run dev`

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_KEY_SECRET` in browser code.

## Important production note

The included payment verification performs a final stock deduction after Razorpay signature verification. For a high-volume production shop, move stock reservation/deduction into a Postgres transaction/RPC to prevent two customers buying the last unit at the same time.

## Razorpay webhook

Configure `https://YOUR-DOMAIN/api/razorpay/webhook` and subscribe to `order.paid`, `payment.captured`, and `payment.failed`. Put the matching secret in `RAZORPAY_WEBHOOK_SECRET`.


## Email/password customer accounts
The login page now supports Create Account and normal email/password Login in addition to Google, Apple and GitHub.
Run the latest `supabase/schema.sql` so `public.profiles` and the new-user trigger are created.
Passwords are handled by Supabase Auth and are never stored in `public.profiles`.
If Supabase Auth > Providers > Email has Confirm email enabled, new customers must confirm their email before the first login.
Add `/auth/update-password` to your allowed redirect URLs for password-reset flow.

Customer bags are kept separately per signed-in account in the browser. A guest bag is merged into that account when the customer signs in; items remain until the customer removes them or a successful checkout clears the bag.

## Storefront and daily rate management

- `/admin/rates`: add or edit the INR price per gram. Effective dates use India time; future rates appear from their effective date. The latest applicable rate appears in the top-left storefront strip and drives product prices.
- `/admin/products`: upload actual product photographs and enter weight, making charge and stock, then enable visibility to publish products in the scroll-reveal collection.
- Rate writes require an administrator and validate positive amounts and valid dates. Saving or deleting rates refreshes storefront pricing.
- Contact links use +91 9655570730 and the store address at 65, Sossaiyappar Kadai Street, Eral 628801.
- The unboxing illustration uses the supplied gift-box, pooja-set and gift-set images. It follows scrolling with spring smoothing and supports reduced-motion preferences.
- If the catalog or rate history is empty, the storefront shows an explicit empty state; no invented price or stock is displayed.
