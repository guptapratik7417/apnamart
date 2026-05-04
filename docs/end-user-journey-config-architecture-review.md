# ApnaMart End User Journey, Config, and Architecture Review

Reviewed on: 2026-04-26

## Executive Summary

ApnaMart is a lean multi-category e-commerce MVP built with Next.js 16 App Router, React 19, Tailwind CSS 4, MariaDB-backed data access, customer-login cart persistence, an admin panel, and Razorpay-ready payment endpoints.

The store should be treated as a broad retail catalog, not only a jewellery store. Supported categories can include jewellery, clothes, baby products, toys, gifts, birthday gifts, and other similar consumer products.

The app is suitable for local demo and MVP review now. Browsing, cart, checkout UI, admin navigation, and production build all work locally. For production launch, the main blockers are configuration and operational hardening: real MariaDB connection values, secure admin credentials, Razorpay keys, order persistence validation, payment webhook reconciliation, and access control review.

## Review Scope

This document reviews:

- Customer storefront journey from discovery to order success.
- Admin journey from login to inventory/order/product operations.
- Runtime and environment configuration.
- Application architecture and main technical risks.
- Recommended readiness checklist for demo, staging, and production.

Out of scope:

- Brand design review.
- Legal, tax, invoicing, return policy, shipping provider, product safety, age suitability, and category-specific compliance.
- Load testing, accessibility testing with assistive devices, and payment gateway certification.

## Category Scope

ApnaMart should support multiple retail categories:

- Jewellery and accessories.
- Clothes and apparel.
- Baby products.
- Toys and children's products.
- Gifts, birthday gifts, return gifts, and seasonal gifting.
- Additional consumer product categories that fit the same catalog, cart, checkout, and admin workflow.

The demo catalog now includes mixed retail categories. Jewellery remains one supported category, not the product boundary.

## Current User-Facing Routes

| Area | Route | Purpose |
| --- | --- | --- |
| Storefront | `/` | Home page with hero, category showcase, and featured products. |
| Storefront | `/products` | Product listing with category, search, sort, and category-specific filters. |
| Storefront | `/products/[slug]` | Product detail with image, price, product attributes, and add-to-cart action. |
| Storefront | `/login` | Customer login and registration. |
| Storefront | `/forgot-password` | Customer requests a password reset email. |
| Storefront | `/reset-password` | Customer sets a new password after clicking the emailed reset link. |
| Storefront | `/cart` | Guest cart review with quantity and remove actions. |
| Storefront | `/checkout` | Guest checkout with shipping form and COD/Razorpay selection. |
| Storefront | `/orders` | Logged-in customer order history. |
| Storefront | `/order-success` | Success confirmation using the locally cached latest order. |
| Admin | `/admin/login` | Password-based admin login. |
| Admin | `/admin` | Admin dashboard. |
| Admin | `/admin/products` | Product list and product actions. |
| Admin | `/admin/products/new` | Product creation form. |
| Admin | `/admin/orders` | Order management. |
| Admin | `/admin/inventory` | Stock and low-inventory overview. |

## End User Journey Review

### Customer Happy Path

1. Landing and discovery

   The customer lands on `/`, sees store positioning, calls to action, category tiles, and featured products.

   Status: Working for demo.

   Notes:

   - Demo data is available when MariaDB is not configured.
   - Above-the-fold image loading has been adjusted for Next.js 16 conventions.
   - Messaging and visuals should be updated to represent the actual category mix: clothes, baby products, toys, gifts, birthday gifts, jewellery, and any future categories.
   - Messaging currently emphasizes MVP simplicity and operational ease. For a real consumer launch, this copy should become brand, trust, and assortment oriented.

2. Browsing and filtering

   The customer goes to `/products`, filters by category or category-specific attributes, searches, and sorts.

   Status: Working for demo and MVP.

   Notes:

   - Filtering is handled through query params and server-rendered product retrieval.
   - Current listing limit is generous for MVP use.
   - There is no visible pagination UI even though the data layer supports page and limit style parameters.

3. Product evaluation

   The customer opens `/products/[slug]`, reviews product image, price, discount, category, product attributes, stock, shipping note, and related products.

   Status: Working for demo and MVP.

   Notes:

   - Product details are clear enough for basic purchase intent.
   - The current attribute model now supports broad product types, while still allowing optional weight for items that need it.
   - Production should add category-specific details: size, color, material, fit, fabric care, age suitability, safety notes, gift packaging, delivery date, certification, warranty, and return eligibility where relevant.

4. Add to cart

   The customer must log in before adding an in-stock product to cart. Cart state is cached in the browser and saved to MariaDB against the logged-in customer when the database is configured.

   Status: Working for demo and MVP.

   Notes:

   - Cart survives page reloads in the same browser.
   - With MariaDB configured, cart items are saved in `carts` and `cart_items`.
   - Cart rows are associated with the customer `users.id`.
   - Anonymous customers are redirected to `/login` before cart mutation.
   - No user account is required.
   - Stock is checked again during order creation.

5. Cart review

   The customer reviews item image, quantity, price, subtotal, shipping charge, and checkout CTA at `/cart`.

   Status: Working for demo and MVP.

   Notes:

   - Shipping threshold and standard charge are driven by site config.
   - Cart pricing uses the local UI snapshot for display, but order creation recalculates prices from the server-side product source.

6. Checkout

   The customer enters guest details and shipping address at `/checkout`, then selects Cash on Delivery or Razorpay.

   Status: COD works for demo. Razorpay requires configuration.

   Notes:

   - Validation covers name, email, Indian phone number, address, city, state, and six-digit pincode.
   - COD can complete immediately.
   - Razorpay loads the hosted checkout script and uses API routes to create and verify payments.

7. Order success

   The customer lands on `/order-success?orderId=...` and sees a success state.

   Status: Working for demo.

   Notes:

   - The success view relies on localStorage for recently completed orders.
   - Without MariaDB configured, created orders are not persisted server-side and will not appear in admin order management.
   - With MariaDB configured, order persistence and stock decrement happen in the server data layer.

### Customer Journey Gaps

| Gap | Impact | Recommendation |
| --- | --- | --- |
| No account or login journey | Good for MVP speed, but no cross-device order history. | Keep guest checkout for MVP, then add optional customer accounts when repeat purchase matters. |
| No policy pages | Customers may hesitate to purchase across high-trust categories such as baby products, toys, clothes, gifts, and jewellery. | Add shipping, returns, privacy, terms, authenticity, safety, exchange, and cancellation pages. |
| No payment webhook | Client-side verification can miss delayed or interrupted payment states. | Add Razorpay webhook handling for production reconciliation. |
| Public order lookup by id | Order data could be exposed if an id is guessed or leaked. | Add signed order access token, email verification, or session-bound order lookup. |
| Limited product trust fields | Each category needs different confidence signals. | Add category-specific metadata such as size charts, fabric/material, age range, toy safety, gift packaging, purity, hallmark, certification, warranty, and return eligibility. |
| No pagination controls | Large catalog browsing will become hard. | Add pagination or infinite loading once catalog exceeds the first page size. |

## Admin Journey Review

### Admin Happy Path

1. Login

   Admin logs in at `/admin/login` using a shared password.

   Status: Working for MVP, not production hardened.

   Notes:

   - Session is stored in an HTTP-only cookie signed with HMAC.
   - Admin login is disabled unless `ADMIN_PASSWORD` is configured.
   - Production must set both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.

2. Dashboard

   Admin views total orders, revenue, products, customers, recent orders, and low-stock products.

   Status: Working for demo.

   Notes:

   - Dashboard uses MariaDB when configured.
   - Without MariaDB, it uses demo orders and demo products.

3. Product management

   Admin can view products, create products, update product fields, delete products, and toggle operational fields through API routes.

   Status: Requires MariaDB for write operations.

   Notes:

   - Product reads have demo fallback.
   - Product writes throw a setup error if MariaDB is not configured.
   - Image insertion exists for create flow. Updating product image sets should be reviewed separately before production use.

4. Category management

   Admin can create and delete categories that drive storefront category filters and product form options.

   Status: Requires MariaDB for write operations.

5. Store settings

   Admin can edit the site config JSON for storefront copy, hero content, navigation, footer support details, shipping rules, checkout payment labels, and product type options.

   Status: Requires MariaDB and the `app_config` table for persistence.

6. Order management

   Admin can view and update order status/payment status through protected API routes.

   Status: Requires MariaDB for real operational use.

   Notes:

   - COD/demo orders created without MariaDB are not persisted in the admin order list.
   - Order update routes are admin-protected.

7. Inventory management

   Admin can review stock and low-stock products.

   Status: Working for demo, requires MariaDB for live inventory.

   Notes:

   - Order creation decrements stock in MariaDB after inserting order items.
   - Order insert, item insert, and stock decrement are wrapped in a MariaDB transaction.

### Admin Journey Gaps

| Gap | Impact | Recommendation |
| --- | --- | --- |
| Shared password admin auth | Simple but weak for production. | Move to a dedicated identity provider with per-admin users and MFA. |
| Missing admin credentials | Admin login cannot be used until configured. | Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` per environment outside source control. |
| No role model in active auth flow | Cannot distinguish admin users or audit actions. | Add admin user records, roles, and action audit logs. |
| Transaction coverage needs testing | The server uses a MariaDB transaction, but failure modes still need integration tests. | Add integration tests for order insert, item insert, stock decrement, rollback, and retry behavior. |
| No admin rate limiting | Login/API abuse risk. | Add rate limiting for login and mutation endpoints. |

## Configuration Review

### Package and Runtime

| Item | Current Value |
| --- | --- |
| Framework | Next.js `16.2.4` |
| React | `19.2.4` |
| Styling | Tailwind CSS 4 via PostCSS |
| Data client | `mysql2` |
| Scripts | `dev`, `build`, `start`, `lint` |

Recommended commands:

```bash
npm install
npm run lint
npm run build
npm run dev
```

### Next.js Config

Configured in `next.config.ts`:

- Allows optimized remote images from `images.unsplash.com`.

Review notes:

- This is appropriate for the current demo image strategy.
- If the business uses another CDN or product media host, update `images.remotePatterns`.
- Keep remote image patterns narrow. Avoid broad wildcard hosts in production.

### Environment Variables

| Variable | Required For | Current Behavior If Missing | Production Recommendation |
| --- | --- | --- | --- |
| `MARIADB_HOST` | MariaDB reads and writes | App falls back to demo data if missing. | Required. Use the database host reachable by the app server. |
| `MARIADB_PORT` | MariaDB connection | Defaults to `3306`. | Required unless the database uses the default port. |
| `MARIADB_USER` | MariaDB connection | App falls back to demo data if missing. | Required. Use an app-specific database user. |
| `MARIADB_PASSWORD` | MariaDB connection | Empty password is allowed for local-only setups. | Required for staging/production. Store securely. |
| `MARIADB_DATABASE` | MariaDB reads and writes | App falls back to demo data if missing. | Required. |
| `MARIADB_CONNECTION_LIMIT` | MariaDB pool sizing | Defaults to `10`. | Tune for deployment size and database capacity. |
| `MARIADB_AUTO_SCHEMA` | Automatic table/index/default seed creation | Defaults to `true`. | Keep enabled locally; disable in production only if migrations are handled externally. |
| `ADMIN_PASSWORD` | Admin login | Admin login is disabled when missing. | Required. Use a strong secret. |
| `ADMIN_SESSION_SECRET` | Admin cookie signing | Falls back to admin password only after a password is configured. | Required. Use a separate high-entropy value. |
| `RAZORPAY_KEY_ID` | Server-side Razorpay order creation | Razorpay flow returns configuration error. | Required for online payment. |
| `RAZORPAY_KEY_SECRET` | Server-side Razorpay order creation and verification | Razorpay flow returns configuration error. | Required, never expose to browser. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser checkout key | Create-order route can use this as key id fallback. | Recommended for client clarity, but keep secret server-only. |

### Environment Modes

| Mode | Expected Behavior |
| --- | --- |
| Local demo without MariaDB | Storefront renders demo catalog. Cart works locally. COD checkout shows success, but order is not persisted server-side. Admin sees demo data. Product/order writes are limited. |
| Local with MariaDB | Storefront reads real catalog. Orders persist. Stock decrements. Admin product/order/inventory tools become operational. |
| Staging with Razorpay test keys | COD and Razorpay can be reviewed end to end. Payment verification should be checked with test cards and failure states. |
| Production | Requires secure admin auth, real MariaDB, Razorpay live keys, webhook reconciliation, legal/policy pages, monitoring, backups, and access-control review. |

Runtime defaults and environment access are centralized in `config/app-properties.ts`. Environment-specific templates are `.env.development.example`, `.env.production.example`, and `.env.test.example`; real `.env*` files remain ignored.

### Database Setup

The intended schema is stored in `mariadb-schema.sql` and is also applied automatically by the app when MariaDB is configured with `MARIADB_AUTO_SCHEMA=true`. It covers:

- Users
- Categories
- Products
- Product images
- App config
- Carts and cart items
- Orders
- Order items
- Payments

Review notes:

- The customer cart requires login, uses browser storage as a local UI cache, and persists items to MariaDB when configured.
- The app uses products, product images, categories, carts, cart items, orders, and order items for the live MVP path.
- Before production, create an app-specific MariaDB user with least-privilege access to the application database.

## Architecture Review

### High-Level Architecture

```text
Browser
  |
  | Next.js pages and client components
  v
App Router UI
  |             \
  |              \ browser cart UI cache and recent order success cache
  v
Route Handlers under app/api
  |
  v
lib/store.ts data access layer
  |
  |-- MariaDB when configured
  |
  |-- demo-data fallback when MariaDB is missing or read queries fail

Razorpay checkout
  |
  |-- /api/payments/create-order
  |
  |-- Razorpay Orders API
  |
  |-- /api/payments/verify
```

### Application Boundaries

| Boundary | Files | Responsibility |
| --- | --- | --- |
| App shell | `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx` | Shared layout, navigation, metadata, and storefront/admin shell behavior. |
| Storefront pages | `app/page.tsx`, `app/products/*`, `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/order-success/page.tsx` | Customer browsing and checkout UX. |
| Admin pages | `app/admin/*` | Admin dashboard, products, orders, inventory, and login UI. |
| API routes | `app/api/*/route.ts` | Product, category, site config, order, admin auth, and payment endpoints. |
| Data access | `lib/store.ts`, `lib/mariadb.ts` | MariaDB queries, demo fallback, normalization, order creation, stock updates. |
| Site config | `config/app-properties.ts`, `lib/site-config.ts`, `app/api/site-config/route.ts` | Admin-editable storefront, checkout, shipping, navigation, footer, and product-type configuration. |
| Client cart | `lib/cart-client.ts` | Browser cart persistence, totals, and React external-store hook. |
| Auth | `lib/admin-auth.ts` | Password check, cookie session create/verify/delete. |
| Types | `types/index.ts` | Shared domain types for products, orders, cart, dashboard, and inputs. |

### Strengths

- Clear App Router structure with route-specific pages and API route handlers.
- Demo data fallback makes local review fast and cheap.
- Guest cart writes now persist before checkout, which improves recovery if the customer refreshes or returns later in the same browser.
- Server-side order creation recalculates product price and stock from the source of truth.
- Product and order mutations are guarded by admin session checks.
- Shared TypeScript domain types keep product/order/cart shapes understandable.
- MariaDB and Razorpay are optional until configured, so the app can be demonstrated before integrations are ready.
- Business-facing storefront copy, nav links, shipping rules, payment labels, footer details, and product type options are centralized in site config instead of page components.

### Main Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Missing admin credentials | High | `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` must be configured outside source control before admin use. |
| Shared password admin model | High | No individual admin identity, MFA, role separation, or audit trail. |
| Missing payment webhook | High | Client-side payment verification alone is not enough for robust reconciliation. |
| Public order detail endpoint | Medium | `/api/orders/[id]` GET is public. This supports success lookup but can leak order data if ids are exposed. |
| Transaction behavior lacks tests | Medium | Order and stock writes use a transaction, but rollback behavior should be covered by integration tests. |
| Demo fallback in production if MariaDB is misconfigured | Medium | Misconfiguration can make the site appear live while serving demo data. |
| Database credential scope | Medium | Over-privileged MariaDB users increase blast radius if secrets leak. |
| Limited product metadata | Medium | Clothes, baby products, toys, gifts, and jewellery all need category-specific attributes and trust details. |
| No observability layer | Medium | Production debugging will be hard without structured logs, error capture, and payment/order alerts. |

### Production Architecture Recommendations

1. Harden admin authentication.

   Replace shared-password auth with a dedicated identity provider. Add admin roles, MFA, audit logs, and rate limiting.

2. Make missing production configuration fail fast.

   In production, missing MariaDB or admin secrets should fail startup or render a controlled maintenance state, not silently fall back to demo data.

3. Add Razorpay webhooks.

   Use server-side webhooks to reconcile `paid`, `failed`, and disputed states. Keep client verification for user feedback, but do not make it the only source of truth.

4. Test order transaction behavior.

   Keep order creation inside a MariaDB transaction and add tests that verify rollback behavior for order item and stock update failures.

5. Secure order access.

   Add a signed order lookup token, customer email verification, or session-bound order success path before exposing order details.

6. Expand product schema for multi-category retail.

   Add flexible category-specific fields. Examples include apparel size, color, material, fabric care, baby age suitability, toy safety notes, gift wrapping, occasion tags, delivery windows, jewellery purity, hallmark/certification, stone details, warranty, return eligibility, and estimated delivery.

7. Add operational monitoring.

   Track checkout errors, payment failures, order creation failures, admin mutations, and inventory thresholds.

8. Add backup and recovery expectations.

   Confirm MariaDB backups, retention, restore process, and admin procedures for correcting orders or inventory.

## Demo Readiness Checklist

- [x] App starts locally with `npm run dev`.
- [x] Storefront routes render with demo data.
- [x] Guest cart state works in-browser and persists to MariaDB when configured.
- [x] COD checkout can complete locally.
- [x] Admin login screen is available.
- [x] Production build passes locally.
- [ ] Demo reviewer has the local URL and admin password.
- [ ] Demo reviewer understands that missing MariaDB means orders are not persisted server-side.

## Staging Readiness Checklist

- [ ] MariaDB database and app user are created.
- [ ] The app has started once with `MARIADB_AUTO_SCHEMA=true`, or `mariadb-schema.sql` has been applied manually.
- [ ] Real product/category data is loaded.
- [ ] Site config is saved from `/admin/settings`.
- [ ] `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, and `MARIADB_DATABASE` are configured.
- [ ] `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are configured.
- [ ] Razorpay test keys are configured if online payment will be reviewed.
- [ ] COD order appears in admin after checkout.
- [ ] Razorpay success, cancel, and failure paths are tested.
- [ ] Stock decrements after successful order creation.
- [ ] Admin product create/update/delete actions are tested.

## Production Readiness Checklist

- [x] Default admin fallback is removed.
- [ ] Admin auth is upgraded or explicitly accepted as an MVP operational risk.
- [ ] MariaDB app user permissions are reviewed and tested.
- [ ] Database credentials are stored only in server-side environment.
- [ ] Razorpay webhooks are implemented and verified.
- [ ] Order creation and inventory updates are atomic.
- [ ] Public order lookup is protected.
- [ ] Policy pages are added: privacy, terms, shipping, returns, cancellations, and authenticity.
- [ ] Product trust metadata is available for each supported category.
- [ ] Error monitoring and alerting are configured.
- [ ] Database backup and restore process is documented.
- [ ] Basic accessibility and mobile QA are completed.
- [ ] SEO metadata and sitemap strategy are reviewed.

## Final Recommendation

Use the current app for local stakeholder review and early MVP flow validation. Before accepting real customer orders, prioritize configuration hardening, durable order persistence, payment reconciliation, and admin security. The codebase has a straightforward shape for an MVP, but production confidence will depend on tightening the boundaries around secrets, payments, order access, and database consistency.
