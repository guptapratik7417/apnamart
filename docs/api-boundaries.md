# API Boundaries

This app has three API categories. Keep them separate so customer/admin UI code, seller integrations, and third-party provider calls do not blur together.

Swagger UI is available at `/api/docs`, and the raw OpenAPI document is available at `/api/openapi`.

Set `SERVICE_MODE` to run one route group independently:

| `SERVICE_MODE` | Intended process |
| --- | --- |
| `all` | Full app; default |
| `storefront` | Storefront pages plus customer-facing support APIs |
| `admin` | Admin pages plus admin support APIs |
| `api` | Internal non-admin API surface |
| `integrations` | External partner API surface |

## 1. Internal App APIs

Internal APIs are called by ApnaMart pages/components only. They use customer/admin cookies or server-side app trust. Do not expose these as partner contracts.

| Area | Routes | Caller | Auth |
| --- | --- | --- | --- |
| Customer auth | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/session`, `/api/auth/profile`, `/api/auth/forgot-password`, `/api/auth/reset-password` | Storefront customer UI | Customer cookie where needed |
| Admin auth | `/api/admin/login`, `/api/admin/logout`, `/api/admin/session`, `/api/admin/database` | Admin UI | Admin cookie |
| Cart | `/api/cart` | Storefront cart/checkout UI | Customer cookie |
| Catalog | `/api/products`, `/api/products/[id]`, `/api/categories`, `/api/categories/[id]` | Storefront and admin UI | Public read, admin write |
| Site config | `/api/site-config` | Storefront/admin settings UI | Public read, admin write |
| Orders | `/api/orders`, `/api/orders/[id]` | Checkout, order success, admin orders UI | Customer/admin depending action |
| Payments | `/api/payments/cod`, `/api/payments/create-order`, `/api/payments/verify` | Payment page and Razorpay callback handling | Internal flow |
| Pincode | `/api/pincode/[pincode]` | Checkout address form | Public utility |

## 2. External Partner APIs

External partner APIs are stable stubs intended for sellers, delivery partners, or other back-office systems. These use token auth, not browser cookies.

Auth header:

```http
Authorization: Bearer <INTEGRATION_API_TOKEN>
```

or:

```http
x-api-key: <INTEGRATION_API_TOKEN>
```

| Route | Purpose | Status |
| --- | --- | --- |
| `GET /api/integrations/categories` | List storefront categories for partner sync. | Implemented |
| `GET /api/integrations/products` | List products for partner sync. Supports catalog query params. | Implemented |
| `GET /api/integrations/products/[id]` | Fetch one product by internal id. | Implemented |
| `GET /api/integrations/orders` | List orders for seller/partner sync. Supports `status` and `limit` query params. | Implemented |
| `GET /api/integrations/orders/[id]` | Fetch one order by internal id or order number. | Implemented |
| `PATCH /api/integrations/orders/[id]` | Update DB-backed order status. | Implemented |

These are the routes to share with external parties first. Add versioning such as `/api/integrations/v1/...` before locking a long-term public contract.

## 3. Third-Party Provider Integrations

These are backend adapters from ApnaMart to external providers. They should not be called directly by sellers/customers.

| Provider | Routes / Files | Direction | Requires |
| --- | --- | --- | --- |
| Razorpay | `/api/payments/create-order`, `/api/payments/verify` | ApnaMart -> Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| Shiprocket | `/api/shiprocket/serviceability`, `/api/shiprocket/orders/[id]/create`, `/api/shiprocket/track/[awb]`, `lib/shiprocket.ts` | ApnaMart -> Shiprocket | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION` |
| Google Analytics | `app/layout.tsx` | Browser -> Google tag | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Pincode lookup | `/api/pincode/[pincode]` | ApnaMart -> pincode lookup services | No credential currently |

## Naming Rule

- `/api/auth`, `/api/admin`, `/api/cart`, `/api/orders`, `/api/payments`, `/api/products`, `/api/categories`, `/api/site-config`: internal app surface.
- `/api/integrations/...`: external partner surface.
- `/api/shiprocket/...`: third-party delivery provider adapter.

This keeps partner contracts narrow while allowing internal app routes to change with the UI.
