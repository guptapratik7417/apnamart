# Multi-Category E-commerce MVP Specification

## Project Overview
- **Project Name**: ApnaMart
- **Type**: Full-stack E-commerce Web Application
- **Core Functionality**: Multi-category retail marketplace with customer storefront and admin management panel
- **Supported Categories**: Clothes, baby products, toys, gifts, birthday gifts, jewellery, accessories, and similar retail products
- **Target Users**: Customers browsing/purchasing retail products, Admin managing catalog, inventory, and orders

---

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: MariaDB
- **Authentication**: Admin password cookie for MVP
- **Payments**: Razorpay
- **Analytics**: Google Analytics

---

## Configuration

- All code-facing defaults and runtime property access are centralized in `config/app-properties.ts`.
- Environment-specific secret/property templates live in `.env.development.example`, `.env.production.example`, and `.env.test.example`.
- Real `.env*` files stay ignored; copy the matching example to `.env.local` locally or configure variables in the deployment platform.
- MariaDB connection values use `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_DATABASE`, and `MARIADB_CONNECTION_LIMIT`.
- Storefront copy, navigation, footer, shipping, checkout labels, payment method labels, and product type options are admin-editable through `/admin/settings` and persisted in `app_config`.

---

## Database Schema

### Tables

```sql
-- Users
users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(40),
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'customer', -- 'customer' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Categories
categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Products
products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category_id CHAR(36) REFERENCES categories(id),
  stock_quantity INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  is_featured TINYINT(1) DEFAULT 0,
  attribute_tag VARCHAR(100), -- configured in admin site settings
  weight_grams DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Product Images
product_images (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  display_order INT DEFAULT 0
)

-- Password Reset Tokens
password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Carts
carts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) REFERENCES users(id),
  session_id VARCHAR(255), -- for guest users
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Cart Items
cart_items (
  id CHAR(36) PRIMARY KEY,
  cart_id CHAR(36) REFERENCES carts(id) ON DELETE CASCADE,
  product_id CHAR(36) REFERENCES products(id),
  quantity INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Orders
orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) REFERENCES users(id),
  order_number VARCHAR(80) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_charge DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_name VARCHAR(255),
  shipping_address TEXT,
  shipping_city VARCHAR(120),
  shipping_state VARCHAR(120),
  shipping_pincode VARCHAR(20),
  shipping_phone VARCHAR(40),
  payment_method VARCHAR(30), -- 'razorpay' | 'cod'
  payment_id VARCHAR(255),
  payment_status VARCHAR(30) DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Order Items
order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) REFERENCES orders(id) ON DELETE CASCADE,
  product_id CHAR(36) REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  total DECIMAL(10,2) NOT NULL
)

-- Payments
payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) REFERENCES orders(id),
  razorpay_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- App Config
app_config (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## Customer Website Structure

### Pages

1. **Home** (`/`)
   - Hero banner with CTA
   - Featured products grid (8 products)
   - Category showcase (4 categories)
   - Why choose us section

2. **Product Listing** (`/products`)
   - Filter sidebar (category, price range, product type)
   - Sort dropdown (price, newest, popularity)
   - Product grid (12 per page)
   - Pagination

3. **Product Details** (`/products/[slug]`)
   - Image gallery with zoom
   - Product info (name, price, description)
   - Category-specific product details
   - Quantity selector
   - Add to cart button
   - Related products

4. **Cart** (`/cart`)
   - Cart items list
   - Quantity update/remove
   - Subtotal calculation
   - Proceed to checkout button

5. **Checkout** (`/checkout`)
   - Shipping address form
   - Order summary
   - Payment method selection (Razorpay/COD)
   - Place order button

6. **Order Success** (`/order-success`)
   - Success message
   - Order details
   - Continue shopping button

---

## Admin Panel Structure

### Pages

1. **Login** (`/admin/login`)
   - Email/password form
   - Admin authentication

2. **Dashboard** (`/admin`)
   - Stats cards (orders, revenue, products, customers)
   - Recent orders list
   - Low stock alerts

3. **Products** (`/admin/products`)
   - Products table with search
   - Add/Edit product modal
   - Delete product action
   - Toggle active status

4. **Categories** (`/admin/categories`)
   - Add product categories
   - Delete unused categories
   - Drive storefront category filters

5. **Orders** (`/admin/orders`)
   - Orders table with filters
   - View order details
   - Update order status

6. **Inventory** (`/admin/inventory`)
   - Stock levels overview
   - Low stock alerts
   - Bulk update stock

7. **Settings** (`/admin/settings`)
   - Storefront copy and hero content
   - Navigation and footer links
   - Support details
   - Shipping threshold and standard charge
   - Checkout payment labels and descriptions
   - Product type options

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with filters |
| GET | `/api/products/[slug]` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/[id]` | Update product (admin) |
| DELETE | `/api/products/[id]` | Delete product (admin) |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category (admin) |
| PATCH | `/api/categories/[id]` | Update category (admin) |
| DELETE | `/api/categories/[id]` | Delete category (admin) |
| GET | `/api/site-config` | Read site config |
| PUT | `/api/site-config` | Update site config (admin) |
| GET | `/api/cart` | Get logged-in customer cart items |
| PUT | `/api/cart` | Save logged-in customer cart items |
| DELETE | `/api/cart` | Clear logged-in customer cart items |
| POST | `/api/auth/register` | Create customer account |
| POST | `/api/auth/login` | Customer login |
| POST | `/api/auth/logout` | Customer logout |
| GET | `/api/auth/session` | Current customer session |
| POST | `/api/auth/forgot-password` | Email password reset link |
| POST | `/api/auth/reset-password` | Set new password from reset token |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders (admin) |
| GET | `/api/orders/[id]` | Get order details |
| PUT | `/api/orders/[id]/status` | Update order status |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |

---

## Integrations

### MariaDB
- Local relational database
- Product, category, order, inventory, and site config persistence
- Accessed from server-side code through `mysql2`

### Razorpay
- Payment gateway integration
- Order creation API
- Payment verification webhook

### Google Analytics
- Page view tracking
- E-commerce events (view_item, add_to_cart, purchase)

---

## UI/UX Guidelines

### Color Palette
- Primary: `#B8860B` (Warm retail accent)
- Secondary: `#1A1A1A` (Dark)
- Accent: `#D4AF37` (Warm highlight)
- Background: `#FAFAFA`
- Text: `#333333`
- Error: `#E53935`
- Success: `#43A047`

### Typography
- Headings: Playfair Display
- Body: Inter

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Acceptance Criteria

1. ✅ Customer can browse products by category
2. ✅ Customer can view product details
3. ✅ Customer can add products to cart
4. ✅ Customer can complete checkout with Razorpay
5. ✅ Customer receives order confirmation
6. ✅ Admin can login to dashboard
7. ✅ Admin can manage products (CRUD)
8. ✅ Admin can view and manage orders
9. ✅ Admin can update inventory
10. ✅ Responsive design works on all devices
