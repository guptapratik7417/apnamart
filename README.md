# ApnaMart Multi-Category MVP

Lean multi-category e-commerce app built with Next.js 16, MariaDB, and Razorpay-ready payment routes.

ApnaMart is designed for clothes, baby products, toys, gifts, birthday gifts, jewellery, accessories, and similar catalog-driven retail products.

## Why This Setup Is Low Maintenance

- Customer cart requires customer login before add-to-cart, then persists in MariaDB with browser storage kept only as the local UI cache/session holder.
- Customer login/register stores shopper profile data in MariaDB and attaches cart/order rows to `users.id`.
- Catalog, categories, orders, inventory, and site settings use MariaDB only when real env vars are configured.
- When MariaDB is configured, the app can create missing tables, indexes, seed categories/products, and the default `app_config` row automatically.
- The app has demo data fallback, so it builds and runs before MariaDB setup.
- Admin access uses one server-side password cookie for the MVP.
- COD works immediately; Razorpay can be enabled by adding live/test keys.
- Store copy, navigation, footer support details, shipping rules, checkout payment labels, and product type options are driven by admin-editable site config.
- Code-facing defaults and runtime settings are centralized in `config/app-properties.ts`; real secrets stay in environment-specific `.env*` files.

## Pages

- Storefront: `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/order-success`
- Customer: `/login`, `/forgot-password`, `/reset-password`, `/cart`, `/checkout`, `/orders`, `/order-success`
- Admin: `/admin/login`, `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/inventory`, `/admin/settings`
- APIs: internal app APIs plus partner/provider integration stubs are separated in `docs/api-boundaries.md`.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Service Modes

The app can run as one full service or as focused service processes. `SERVICE_MODE=all` is the default and allows every route.

| Mode | Command | Allows |
| --- | --- | --- |
| Full app | `npm run dev` | Storefront, admin, internal APIs, provider adapters, partner APIs |
| Storefront FE | `npm run dev:storefront` | Storefront pages plus the customer APIs they call |
| Admin | `npm run dev:admin` | `/admin` pages plus admin/catalog/order/config/provider APIs |
| Internal API | `npm run dev:api` | Internal non-admin API routes only |
| External API | `npm run dev:integrations` | `/api/integrations/*` partner routes only |

Run multiple services independently by assigning different ports:

```bash
npm run dev:storefront -- -p 3000
npm run dev:admin -- -p 3001
npm run dev:api -- -p 3002
npm run dev:integrations -- -p 3003
```

Each mode also has a log-writing variant:

```bash
npm run dev:storefront:log
npm run dev:admin:log
npm run dev:api:log
npm run dev:integrations:log
```

Logs are written to `logs/storefront.log`, `logs/admin.log`, `logs/api.log`, and `logs/integrations.log`.

## API Docs

Swagger UI is available at:

```text
http://localhost:3000/api/docs
```

The raw OpenAPI document is available at:

```text
http://localhost:3000/api/openapi
```

The docs endpoints are available in every service mode so you can inspect the enabled API contract while running a focused service.

Partner-facing catalog APIs are available in integration mode:

```text
GET /api/integrations/categories
GET /api/integrations/products
GET /api/integrations/products/{id}
```

Customer reviews are gated by `reviews.reviewWindowDays` in the site config JSON. Product reviews appear only on product pages. Company reviews with rating greater than or equal to `reviews.footerMinRating` appear in the footer, capped by `reviews.footerLimit`. Reviews can include up to three image/video files, stored locally under `public/uploads/reviews`. Review editing is controlled by `reviews.allowReviewEdits` and `reviews.reviewEditWindowDays`.

Create an environment file from the matching template:

```bash
cp .env.development.example .env.local
```

Then set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local` before using the admin panel.

Environment templates:

- `.env.development.example`
- `.env.production.example`
- `.env.test.example`

## MariaDB Setup

1. Add real values to the active environment file:

```bash
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_USER=
MARIADB_PASSWORD=
MARIADB_DATABASE=
MARIADB_CONNECTION_LIMIT=10
MARIADB_AUTO_SCHEMA=true
```

2. Start the app. With `MARIADB_AUTO_SCHEMA=true`, it creates the required tables and seed data inside that existing database on the first database request.

You can still run `mariadb-schema.sql` manually if you prefer manual initialization:

```bash
mariadb -h "$MARIADB_HOST" -P "$MARIADB_PORT" -u "$MARIADB_USER" -p "$MARIADB_DATABASE" < mariadb-schema.sql
```

Cart/product/order/config writes use the MariaDB connection from server-side code only.

Admin settings use the `app_config` table. If MariaDB is not configured, the app uses the central default config in `config/app-properties.ts` for local demo only.

After logging in as admin, call `/api/admin/database` to verify whether the app can connect and create/read the expected tables. The response does not expose the database password.

## Razorpay Setup

Add these when you want online payment checkout:

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Until then, keep checkout on Cash on Delivery for the cheapest MVP launch path.

## Email Setup

Forgot-password emails use Resend over HTTPS:

```bash
EMAIL_PROVIDER=resend
EMAIL_FROM=
RESEND_API_KEY=
```

The password reset token is never shown in the UI. The user receives a reset link by email and returns to `/reset-password` from that link.

## Verify

```bash
npm run lint
npm run build
```
