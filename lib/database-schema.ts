import { pbkdf2Sync, randomBytes } from "crypto";
import type { Pool } from "mysql2/promise";

import {
  defaultSiteConfig,
  getAdminRuntimeProperties,
  splitSiteConfigRecords,
} from "@/config/app-properties";

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(40),
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (role IN ('customer', 'admin'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS admin_users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (role IN ('admin', 'super_admin', 'client_admin', 'seller_admin'))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id CHAR(36),
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    rating_average DECIMAL(2,1) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    attribute_tag VARCHAR(100),
    weight_grams DECIMAL(10,2),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS product_images (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS carts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    session_id VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    id CHAR(36) PRIMARY KEY,
    cart_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (quantity > 0),
    CONSTRAINT fk_cart_items_cart
      FOREIGN KEY (cart_id) REFERENCES carts(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    order_number VARCHAR(80) UNIQUE NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    shipping_name VARCHAR(255),
    shipping_address TEXT,
    shipping_city VARCHAR(120),
    shipping_state VARCHAR(120),
    shipping_pincode VARCHAR(20),
    shipping_phone VARCHAR(40),
    payment_method VARCHAR(30),
    payment_id VARCHAR(255),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    shiprocket_order_id VARCHAR(255),
    shiprocket_shipment_id VARCHAR(255),
    shiprocket_awb_code VARCHAR(255),
    shiprocket_courier_name VARCHAR(255),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'refund_requested', 'refund_approved', 'refund_rejected', 'refunded')),
    CHECK (payment_method IS NULL OR payment_method IN ('razorpay', 'cod')),
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    CONSTRAINT fk_orders_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36),
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (quantity > 0),
    CONSTRAINT fk_order_items_order
      FOREIGN KEY (order_id) REFERENCES orders(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    razorpay_payment_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    CONSTRAINT fk_payments_order
      FOREIGN KEY (order_id) REFERENCES orders(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36),
    review_target VARCHAR(20) NOT NULL DEFAULT 'product',
    user_id CHAR(36),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)),
    is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (review_target IN ('product', 'company')),
    CONSTRAINT fk_reviews_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS app_config (
    \`key\` VARCHAR(100) PRIMARY KEY,
    \`value\` LONGTEXT NOT NULL CHECK (JSON_VALID(\`value\`)),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS wishlists (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_wishlists_user_product (user_id, product_id),
    CONSTRAINT fk_wishlists_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS banner_images (
    id CHAR(36) PRIMARY KEY,
    eyebrow VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_alt VARCHAR(255),
    primary_cta_label VARCHAR(120),
    primary_cta_href TEXT,
    secondary_cta_label VARCHAR(120),
    secondary_cta_href TEXT,
    href TEXT,
    discount_badge_text TEXT,
    show_discount_badge TINYINT(1) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS support_tickets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    order_id CHAR(36),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    phone VARCHAR(40),
    order_number VARCHAR(80),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)),
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT fk_support_tickets_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL,
    CONSTRAINT fk_support_tickets_order
      FOREIGN KEY (order_id) REFERENCES orders(id)
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id CHAR(36) PRIMARY KEY,
    ticket_id CHAR(36) NOT NULL,
    author_type VARCHAR(20) NOT NULL DEFAULT 'admin',
    author_name VARCHAR(255),
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    message TEXT NOT NULL,
    media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (author_type IN ('customer', 'admin')),
    CHECK (visibility IN ('public', 'private')),
    CONSTRAINT fk_support_ticket_replies_ticket
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const indexStatements = [
  ["products", "idx_products_category", "CREATE INDEX idx_products_category ON products(category_id)"],
  ["products", "idx_products_slug", "CREATE INDEX idx_products_slug ON products(slug)"],
  ["products", "idx_products_is_active", "CREATE INDEX idx_products_is_active ON products(is_active)"],
  ["products", "idx_products_is_featured", "CREATE INDEX idx_products_is_featured ON products(is_featured)"],
  ["product_images", "idx_product_images_product", "CREATE INDEX idx_product_images_product ON product_images(product_id)"],
  ["cart_items", "idx_cart_items_cart", "CREATE INDEX idx_cart_items_cart ON cart_items(cart_id)"],
  ["password_reset_tokens", "idx_password_reset_tokens_user", "CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id)"],
  ["password_reset_tokens", "idx_password_reset_tokens_expires", "CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at)"],
  ["orders", "idx_orders_user", "CREATE INDEX idx_orders_user ON orders(user_id)"],
  ["orders", "idx_orders_customer_email", "CREATE INDEX idx_orders_customer_email ON orders(customer_email)"],
  ["orders", "idx_orders_status", "CREATE INDEX idx_orders_status ON orders(status)"],
  ["order_items", "idx_order_items_order", "CREATE INDEX idx_order_items_order ON order_items(order_id)"],
  ["reviews", "idx_reviews_product", "CREATE INDEX idx_reviews_product ON reviews(product_id)"],
  ["reviews", "idx_reviews_target", "CREATE INDEX idx_reviews_target ON reviews(review_target)"],
  ["reviews", "idx_reviews_user", "CREATE INDEX idx_reviews_user ON reviews(user_id)"],
  ["app_config", "idx_app_config_active", "CREATE INDEX idx_app_config_active ON app_config(is_active)"],
  ["wishlists", "idx_wishlists_user", "CREATE INDEX idx_wishlists_user ON wishlists(user_id)"],
  ["wishlists", "idx_wishlists_product", "CREATE INDEX idx_wishlists_product ON wishlists(product_id)"],
  ["banner_images", "idx_banner_images_active_order", "CREATE INDEX idx_banner_images_active_order ON banner_images(is_active, display_order)"],
  ["support_tickets", "idx_support_tickets_status", "CREATE INDEX idx_support_tickets_status ON support_tickets(status)"],
  ["support_tickets", "idx_support_tickets_email", "CREATE INDEX idx_support_tickets_email ON support_tickets(customer_email)"],
  ["support_tickets", "idx_support_tickets_user", "CREATE INDEX idx_support_tickets_user ON support_tickets(user_id)"],
  ["support_tickets", "idx_support_tickets_order", "CREATE INDEX idx_support_tickets_order ON support_tickets(order_id)"],
  ["support_ticket_replies", "idx_support_ticket_replies_ticket", "CREATE INDEX idx_support_ticket_replies_ticket ON support_ticket_replies(ticket_id)"],
] as const;

const seedCategoriesStatement = `INSERT INTO categories (id, name, slug, description, image_url, display_order) VALUES
  (UUID(), 'Kids', 'kids', 'Fun, cute, and trendy', '/demo/photos/kids-category.png', 10),
  (UUID(), 'Ladies', 'ladies', 'Style for every you', '/demo/photos/ladies-category.png', 20),
  (UUID(), 'Toys', 'toys', 'Play, learn, and have fun', '/demo/photos/toys-category.png', 30),
  (UUID(), 'Jewellery', 'jewellery', 'Sparkle every moment', '/demo/photos/jewellery-category.png', 40),
  (UUID(), 'Gifts', 'gifts', 'For every occasion', '/demo/photos/gifts-category.png', 50)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  display_order = VALUES(display_order)`;

const seedProductsStatement = `INSERT INTO products
  (
    id, name, slug, description, price, original_price, category_id,
    stock_quantity, is_active, is_featured, rating_average, review_count,
    attribute_tag, weight_grams
  )
VALUES
  (UUID(), 'Kids Hoodie', 'kids-hoodie', 'Fun yellow hoodie for everyday comfort', 1499, 2499, (SELECT id FROM categories WHERE slug = 'kids'), 36, 1, 1, 4.5, 31, 'apparel', null),
  (UUID(), 'Floral Frock', 'floral-frock', 'Pink floral frock with a soft party-ready finish', 2499, 3999, (SELECT id FROM categories WHERE slug = 'ladies'), 40, 1, 1, 4.7, 38, 'apparel', null),
  (UUID(), 'Denim Jacket', 'denim-jacket', 'Everyday denim jacket for easy layering', 2999, 4999, (SELECT id FROM categories WHERE slug = 'ladies'), 28, 1, 1, 4.6, 52, 'apparel', null),
  (UUID(), 'Teddy Bear', 'teddy-bear', 'Soft teddy bear for gifting and playtime', 1999, 2999, (SELECT id FROM categories WHERE slug = 'toys'), 35, 1, 1, 4.5, 24, 'toys', null),
  (UUID(), 'Kids Play Set', 'kids-play-set', 'Colorful block set for play and learning', 3499, 5499, (SELECT id FROM categories WHERE slug = 'toys'), 30, 1, 1, 4.4, 33, 'toys', null),
  (UUID(), 'Heart Pendant', 'heart-pendant', 'Sparkling heart pendant for special moments', 1499, 2499, (SELECT id FROM categories WHERE slug = 'jewellery'), 24, 1, 1, 4.8, 27, 'jewellery', 5.2),
  (UUID(), 'Gift Box', 'gift-box', 'Ready-to-gift present for special celebrations', 999, 1599, (SELECT id FROM categories WHERE slug = 'gifts'), 25, 1, 1, 4.3, 42, 'gifts', null),
  (UUID(), 'Party Gift Hamper', 'party-gift-hamper', 'Premium pink gift hamper with toys and jewellery accents', 2199, 3499, (SELECT id FROM categories WHERE slug = 'gifts'), 32, 1, 1, 4.6, 19, 'gifts', null),
  (UUID(), 'Pink Occasion Kurta', 'pink-occasion-kurta', 'Elegant pink kurta for festive family outings', 1899, 2999, (SELECT id FROM categories WHERE slug = 'ladies'), 34, 1, 1, 4.5, 22, 'apparel', null),
  (UUID(), 'Stacking Toy Set', 'stacking-toy-set', 'Bright stacking toy set for early learning play', 1299, 1999, (SELECT id FROM categories WHERE slug = 'toys'), 45, 1, 1, 4.4, 16, 'toys', null),
  (UUID(), 'Kids Yellow Hoodie', 'kids-yellow-hoodie', 'Cheerful yellow hoodie for kids casual wear', 1599, 2499, (SELECT id FROM categories WHERE slug = 'kids'), 30, 0, 0, 4.5, 18, 'apparel', null),
  (UUID(), 'Rose Jewellery Set', 'rose-jewellery-set', 'Heart pendant and earrings set for gifting', 2299, 3599, (SELECT id FROM categories WHERE slug = 'jewellery'), 20, 1, 1, 4.8, 21, 'jewellery', 6.1),
  (UUID(), 'Gold Coin Pendant', 'gold-coin-pendant', 'Minimal gold coin pendant for daily styling', 1799, 2699, (SELECT id FROM categories WHERE slug = 'jewellery'), 22, 0, 0, 4.7, 14, 'jewellery', 4.8),
  (UUID(), 'Silver Solitaire Pendant', 'silver-solitaire-pendant', 'Silver chain pendant with a bright solitaire look', 2499, 3999, (SELECT id FROM categories WHERE slug = 'jewellery'), 16, 0, 0, 4.8, 17, 'jewellery', 5.4),
  (UUID(), 'Rose Charm Necklace', 'rose-charm-necklace', 'Rose gold charm necklace with a soft festive finish', 1999, 3199, (SELECT id FROM categories WHERE slug = 'jewellery'), 18, 0, 0, 4.6, 12, 'jewellery', 5.9),
  (UUID(), 'Soft Sweater Teddy', 'soft-sweater-teddy', 'Soft teddy bear dressed in a cozy sweater', 1599, 2499, (SELECT id FROM categories WHERE slug = 'toys'), 30, 0, 0, 4.6, 21, 'toys', null),
  (UUID(), 'Cream Plush Teddy', 'cream-plush-teddy', 'Cream plush teddy bear for birthdays and gifting', 1399, 2199, (SELECT id FROM categories WHERE slug = 'toys'), 34, 0, 0, 4.5, 18, 'toys', null),
  (UUID(), 'Couple Teddy Set', 'couple-teddy-set', 'Pair of teddy bears for anniversaries and celebrations', 2699, 3999, (SELECT id FROM categories WHERE slug = 'gifts'), 20, 0, 0, 4.7, 13, 'gifts', null),
  (UUID(), 'Pink Beauty Hamper', 'pink-beauty-hamper', 'Pink self-care gift hamper with beauty essentials', 2499, 3799, (SELECT id FROM categories WHERE slug = 'gifts'), 24, 0, 0, 4.6, 16, 'gifts', null),
  (UUID(), 'Couple Coffee Gift Set', 'couple-coffee-gift-set', 'Couple mugs, rose accents, and coffee gift box', 1899, 2999, (SELECT id FROM categories WHERE slug = 'gifts'), 26, 0, 0, 4.5, 15, 'gifts', null),
  (UUID(), 'Beige Slip Dress', 'beige-slip-dress', 'Elegant beige slip dress with jacket styling', 3299, 4999, (SELECT id FROM categories WHERE slug = 'ladies'), 18, 0, 0, 4.6, 20, 'apparel', null),
  (UUID(), 'Printed Summer Dress', 'printed-summer-dress', 'Colorful printed summer dress with a relaxed fit', 1799, 2799, (SELECT id FROM categories WHERE slug = 'ladies'), 28, 0, 0, 4.4, 19, 'apparel', null),
  (UUID(), 'Casual Co-ord Set', 'casual-coord-set', 'Casual co-ord set for easy everyday styling', 2299, 3499, (SELECT id FROM categories WHERE slug = 'ladies'), 30, 0, 0, 4.5, 23, 'apparel', null),
  (UUID(), 'Blue Midi Dress', 'blue-midi-dress', 'Soft blue midi dress for brunch and day outings', 2599, 3999, (SELECT id FROM categories WHERE slug = 'ladies'), 22, 0, 0, 4.6, 18, 'apparel', null),
  (UUID(), 'Yellow Festive Lehenga', 'yellow-festive-lehenga', 'Bright yellow festive lehenga with colorful detailing', 4999, 7499, (SELECT id FROM categories WHERE slug = 'ladies'), 12, 0, 0, 4.8, 11, 'apparel', null)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  original_price = VALUES(original_price),
  category_id = VALUES(category_id),
  stock_quantity = VALUES(stock_quantity),
  rating_average = VALUES(rating_average),
  review_count = VALUES(review_count),
  attribute_tag = VALUES(attribute_tag),
  weight_grams = VALUES(weight_grams)`;

const cleanupSeedProductImagesStatement = `DELETE pi
FROM product_images pi
WHERE pi.image_url LIKE 'https://images.unsplash.com/%'
   OR pi.image_url LIKE '/demo/%.svg'`;

const seedProductImagesStatement = `INSERT INTO product_images (id, product_id, image_url, is_primary, display_order)
SELECT UUID(), p.id, sample.image_url, 1, 0
FROM products p
JOIN (
  SELECT 'kids-hoodie' AS slug, '/demo/photos/kids-hoodie.png' AS image_url
  UNION ALL SELECT 'floral-frock', '/demo/photos/floral-frock.png'
  UNION ALL SELECT 'denim-jacket', '/demo/photos/denim-jacket.png'
  UNION ALL SELECT 'teddy-bear', '/demo/photos/teddy-bear.png'
  UNION ALL SELECT 'kids-play-set', '/demo/photos/kids-play-set.png'
  UNION ALL SELECT 'heart-pendant', '/demo/photos/heart-pendant.png'
  UNION ALL SELECT 'gift-box', '/demo/photos/gift-box.png'
  UNION ALL SELECT 'kids-yellow-hoodie', '/demo/photos/kids-hoodie.png'
  UNION ALL SELECT 'boys-cotton-t-shirt', '/demo/photos/kids-hoodie.png'
  UNION ALL SELECT 'girls-party-dress', '/demo/photos/floral-frock.png'
  UNION ALL SELECT 'ladies-kurta', '/demo/photos/ladies-kurta.png'
  UNION ALL SELECT 'gold-pendant-necklace', '/demo/photos/heart-pendant.png'
  UNION ALL SELECT 'birthday-gift-box', '/demo/photos/gift-box.png'
  UNION ALL SELECT 'baby-care-gift-hamper', '/demo/photos/gift-hamper.png'
  UNION ALL SELECT 'cotton-kids-t-shirt', '/demo/photos/kids-hoodie.png'
  UNION ALL SELECT 'everyday-cotton-kurta', '/demo/photos/ladies-kurta.png'
  UNION ALL SELECT 'party-decoration-kit', '/demo/photos/kids-play-set.png'
  UNION ALL SELECT 'soft-baby-blanket', '/demo/photos/kids-hoodie.png'
  UNION ALL SELECT 'wooden-learning-toy-set', '/demo/photos/kids-play-set.png'
  UNION ALL SELECT 'party-gift-hamper', '/demo/photos/gift-hamper.png'
  UNION ALL SELECT 'pink-occasion-kurta', '/demo/photos/ladies-kurta.png'
  UNION ALL SELECT 'stacking-toy-set', '/demo/photos/toy-blocks-teddy.png'
  UNION ALL SELECT 'rose-jewellery-set', '/demo/photos/jewellery-set.png'
  UNION ALL SELECT 'gold-coin-pendant', '/demo/photos/jewellery-set.png'
  UNION ALL SELECT 'silver-solitaire-pendant', '/demo/photos/heart-pendant.png'
  UNION ALL SELECT 'rose-charm-necklace', '/demo/photos/jewellery-set.png'
  UNION ALL SELECT 'soft-sweater-teddy', '/demo/photos/teddy-bear.png'
  UNION ALL SELECT 'cream-plush-teddy', '/demo/photos/teddy-bear.png'
  UNION ALL SELECT 'couple-teddy-set', '/demo/photos/teddy-bear.png'
  UNION ALL SELECT 'pink-beauty-hamper', '/demo/photos/gift-hamper.png'
  UNION ALL SELECT 'couple-coffee-gift-set', '/demo/photos/gift-box.png'
  UNION ALL SELECT 'beige-slip-dress', '/demo/photos/ladies-kurta.png'
  UNION ALL SELECT 'printed-summer-dress', '/demo/photos/floral-frock.png'
  UNION ALL SELECT 'casual-coord-set', '/demo/photos/ladies-kurta.png'
  UNION ALL SELECT 'blue-midi-dress', '/demo/photos/floral-frock.png'
  UNION ALL SELECT 'yellow-festive-lehenga', '/demo/photos/ladies-kurta.png'
) sample ON p.slug = sample.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM product_images pi
  WHERE pi.product_id = p.id
)`;

const seedReviewsStatement = `INSERT INTO reviews
  (id, product_id, review_target, user_id, customer_name, customer_email, rating, review_text, media_urls, is_verified_purchase, created_at, updated_at)
SELECT UUID(), p.id, 'product', NULL, sample.customer_name, sample.customer_email, sample.rating, sample.review_text, sample.media_urls, 1, NOW(), NOW()
FROM products p
JOIN (
  SELECT 'floral-frock' AS slug, 'Priya M.' AS customer_name, 'priya@example.com' AS customer_email, 5 AS rating, 'The frock quality is soft and the color looks exactly as expected.' AS review_text, JSON_ARRAY('/demo/photos/floral-frock.png') AS media_urls
  UNION ALL SELECT 'teddy-bear', 'Neha R.', 'neha@example.com', 4, 'Cute teddy, good size, and perfect for gifting.', JSON_ARRAY('/demo/photos/teddy-bear.png')
  UNION ALL SELECT 'heart-pendant', 'Kavya S.', 'kavya@example.com', 5, 'The pendant has a lovely shine and came packed beautifully.', JSON_ARRAY('/demo/photos/heart-pendant.png')
) sample ON p.slug = sample.slug
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r
  WHERE r.review_target = 'product' AND r.product_id = p.id AND r.customer_email = sample.customer_email
)
UNION ALL
SELECT UUID(), NULL, 'company', NULL, 'Aaradhya S.', 'aaradhya@example.com', 5,
  'Lovely packaging, fast support, and the gifts looked premium.',
  JSON_ARRAY('/demo/photos/gifts-category.png'), 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r
  WHERE r.review_target = 'company' AND r.customer_email = 'aaradhya@example.com'
)`;

const seedBannerImagesStatement = `INSERT INTO banner_images
  (
    id, eyebrow, title, description, image_url, image_alt,
    primary_cta_label, primary_cta_href, secondary_cta_label,
    secondary_cta_href, href, discount_badge_text, show_discount_badge,
    display_order, is_active, created_at, updated_at
  )
SELECT UUID(), sample.eyebrow, sample.title, sample.description, sample.image_url,
  sample.image_alt, sample.primary_cta_label, sample.primary_cta_href,
  sample.secondary_cta_label, sample.secondary_cta_href, sample.href,
  sample.discount_badge_text, sample.show_discount_badge,
  sample.display_order, 1, NOW(), NOW()
FROM (
  SELECT
    'Shop Love, Style & Happiness' AS eyebrow,
    'Kids, Ladies, Toys, Jewellery & Gifts' AS title,
    'Everything you love, all in one place. Stylish looks, fun toys, sparkling jewellery, and thoughtful gifts.' AS description,
    '/demo/photos/hero-shopping-natural.png' AS image_url,
    'Family shopping for gifts, toys, and jewellery' AS image_alt,
    'Shop Now' AS primary_cta_label,
    '/products' AS primary_cta_href,
    'Birthday Gifts' AS secondary_cta_label,
    '/products?attribute_tag=birthday' AS secondary_cta_href,
    '/products' AS href,
    'UP TO\\n50%\\nOFF' AS discount_badge_text,
    1 AS show_discount_badge,
    10 AS display_order
  UNION ALL SELECT
    'Fresh Styles',
    'Clothes and accessories for every occasion.',
    'Keep apparel collections easy to discover with admin-managed banner images.',
    '/demo/photos/ladies-category.png',
    'Pink kurta and coordinated fashion styling',
    'Shop Clothes',
    '/products?category=ladies',
    'View Products',
    '/products',
    '/products?category=ladies',
    NULL,
    0,
    20
  UNION ALL SELECT
    'Toys & Gifts',
    'Thoughtful picks for little ones and celebrations.',
    'Highlight toys, gift sets, and birthday items with clickable banners uploaded by admin.',
    '/demo/photos/gift-hamper.png',
    'Gift hamper with toys and jewellery accents',
    'Shop Gifts',
    '/products?category=gifts',
    'Shop Toys',
    '/products?category=toys',
    '/products?category=gifts',
    NULL,
    0,
    30
) sample
WHERE NOT EXISTS (
  SELECT 1 FROM banner_images existing WHERE existing.image_url = sample.image_url
)`;

const backfillBannerDiscountBadgeStatement = `UPDATE banner_images
SET discount_badge_text = COALESCE(NULLIF(discount_badge_text, ''), 'UP TO\\n50%\\nOFF'),
    show_discount_badge = 1
WHERE show_discount_badge = 0
  AND (discount_badge_text IS NULL OR discount_badge_text = '')
  AND (
    image_url = '/demo/photos/hero-shopping-natural.png'
    OR title = 'Kids, Ladies, Toys, Jewellery & Gifts'
  )`;

const demoteLegacyCategoriesStatement = `UPDATE categories
SET display_order = display_order + 900
WHERE slug IN ('baby-products', 'clothes', 'jewellery-accessories', 'boys', 'girls')
  AND display_order < 900`;

const cleanupSeedCategoryImagesStatement = `UPDATE categories
SET image_url = CASE slug
  WHEN 'boys' THEN '/demo/photos/kids-category.png'
  WHEN 'girls' THEN '/demo/photos/floral-frock.png'
  WHEN 'baby-products' THEN '/demo/photos/kids-category.png'
  WHEN 'clothes' THEN '/demo/photos/ladies-category.png'
  WHEN 'jewellery-accessories' THEN '/demo/photos/jewellery-category.png'
  WHEN 'kids' THEN '/demo/photos/kids-category.png'
  WHEN 'ladies' THEN '/demo/photos/ladies-category.png'
  WHEN 'toys' THEN '/demo/photos/toys-category.png'
  WHEN 'jewellery' THEN '/demo/photos/jewellery-category.png'
  WHEN 'gifts' THEN '/demo/photos/gifts-category.png'
  ELSE image_url
END
WHERE image_url LIKE 'https://images.unsplash.com/%'
   OR slug IN ('boys', 'girls', 'baby-products', 'clothes', 'jewellery-accessories', 'kids', 'ladies', 'toys', 'jewellery', 'gifts')`;

const cleanupSeedOrderImagesStatement = `UPDATE order_items
SET product_image = '/demo/photos/gifts-category.png'
WHERE product_image LIKE 'https://images.unsplash.com/%'
   OR product_image LIKE '/demo/%.svg'`;

const cleanupSeedReviewMediaStatement = `UPDATE reviews
SET media_urls = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            media_urls,
            'https://images.unsplash.com/photo-1503944168849-c1246463e59f?w=600',
            '/demo/photos/kids-category.png'
          ),
          'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400',
          '/demo/photos/kids-category.png'
        ),
        'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400',
        '/demo/photos/gifts-category.png'
      ),
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
      '/demo/photos/jewellery-category.png'
    ),
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    '/demo/photos/ladies-category.png'
  ),
  'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
  '/demo/photos/kids-play-set.png'
)
WHERE media_urls LIKE '%images.unsplash.com%'`;

const activateProductsWithUploadedImagesStatement = `UPDATE products p
JOIN product_images pi ON pi.product_id = p.id
SET p.is_active = 1, p.updated_at = NOW()
WHERE pi.image_url LIKE '/uploads/%'`;

export async function ensureDatabaseSchema(pool: Pool) {
  for (const statement of tableStatements) {
    await pool.query(statement);
  }

  await addColumnIfMissing(
    pool,
    "users",
    "password_hash",
    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) AFTER phone"
  );
  await addColumnIfMissing(
    pool,
    "users",
    "updated_at",
    "ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "password_reset_tokens",
    "updated_at",
    "ALTER TABLE password_reset_tokens ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "orders",
    "shiprocket_order_id",
    "ALTER TABLE orders ADD COLUMN shiprocket_order_id VARCHAR(255) AFTER razorpay_payment_id"
  );
  await addColumnIfMissing(
    pool,
    "orders",
    "shiprocket_shipment_id",
    "ALTER TABLE orders ADD COLUMN shiprocket_shipment_id VARCHAR(255) AFTER shiprocket_order_id"
  );
  await addColumnIfMissing(
    pool,
    "orders",
    "shiprocket_awb_code",
    "ALTER TABLE orders ADD COLUMN shiprocket_awb_code VARCHAR(255) AFTER shiprocket_shipment_id"
  );
  await addColumnIfMissing(
    pool,
    "orders",
    "shiprocket_courier_name",
    "ALTER TABLE orders ADD COLUMN shiprocket_courier_name VARCHAR(255) AFTER shiprocket_awb_code"
  );
  await addColumnIfMissing(
    pool,
    "products",
    "rating_average",
    "ALTER TABLE products ADD COLUMN rating_average DECIMAL(2,1) NOT NULL DEFAULT 0 AFTER is_featured"
  );
  await addColumnIfMissing(
    pool,
    "products",
    "review_count",
    "ALTER TABLE products ADD COLUMN review_count INT NOT NULL DEFAULT 0 AFTER rating_average"
  );
  await addColumnIfMissing(
    pool,
    "categories",
    "display_order",
    "ALTER TABLE categories ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER image_url"
  );
  await addColumnIfMissing(
    pool,
    "categories",
    "updated_at",
    "ALTER TABLE categories ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "product_images",
    "created_at",
    "ALTER TABLE product_images ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER display_order"
  );
  await addColumnIfMissing(
    pool,
    "product_images",
    "updated_at",
    "ALTER TABLE product_images ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "carts",
    "updated_at",
    "ALTER TABLE carts ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "cart_items",
    "updated_at",
    "ALTER TABLE cart_items ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "order_items",
    "created_at",
    "ALTER TABLE order_items ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER total"
  );
  await addColumnIfMissing(
    pool,
    "order_items",
    "updated_at",
    "ALTER TABLE order_items ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "payments",
    "updated_at",
    "ALTER TABLE payments ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "app_config",
    "is_active",
    "ALTER TABLE app_config ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER `value`"
  );
  await addColumnIfMissing(
    pool,
    "app_config",
    "created_at",
    "ALTER TABLE app_config ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "display_order",
    "ALTER TABLE banner_images ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER href"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "discount_badge_text",
    "ALTER TABLE banner_images ADD COLUMN discount_badge_text TEXT AFTER href"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "show_discount_badge",
    "ALTER TABLE banner_images ADD COLUMN show_discount_badge TINYINT(1) NOT NULL DEFAULT 0 AFTER discount_badge_text"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "is_active",
    "ALTER TABLE banner_images ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER display_order"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "created_at",
    "ALTER TABLE banner_images ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active"
  );
  await addColumnIfMissing(
    pool,
    "banner_images",
    "updated_at",
    "ALTER TABLE banner_images ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
  );
  await addColumnIfMissing(
    pool,
    "reviews",
    "review_target",
    "ALTER TABLE reviews ADD COLUMN review_target VARCHAR(20) NOT NULL DEFAULT 'product' AFTER product_id"
  );
  await addColumnIfMissing(
    pool,
    "reviews",
    "media_urls",
    "ALTER TABLE reviews ADD COLUMN media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)) AFTER review_text"
  );
  await addColumnIfMissing(
    pool,
    "support_tickets",
    "order_id",
    "ALTER TABLE support_tickets ADD COLUMN order_id CHAR(36) AFTER user_id"
  );
  await addColumnIfMissing(
    pool,
    "support_tickets",
    "media_urls",
    "ALTER TABLE support_tickets ADD COLUMN media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)) AFTER message"
  );
  await addColumnIfMissing(
    pool,
    "support_ticket_replies",
    "media_urls",
    "ALTER TABLE support_ticket_replies ADD COLUMN media_urls LONGTEXT CHECK (media_urls IS NULL OR JSON_VALID(media_urls)) AFTER message"
  );
  await allowCompanyReviews(pool);
  await updateAdminRoleConstraint(pool);
  await updateOrderStatusConstraint(pool);

  for (const [tableName, indexName, statement] of indexStatements) {
    await createIndexIfMissing(pool, tableName, indexName, statement);
  }

  await pool.query(seedCategoriesStatement);
  await pool.query(demoteLegacyCategoriesStatement);
  await pool.query(cleanupSeedCategoryImagesStatement);
  await pool.query(seedProductsStatement);
  await pool.query(cleanupSeedProductImagesStatement);
  await pool.query(cleanupSeedOrderImagesStatement);
  await pool.query(cleanupSeedReviewMediaStatement);
  await pool.query(seedProductImagesStatement);
  await pool.query(activateProductsWithUploadedImagesStatement);
  await pool.query(seedReviewsStatement);
  await pool.query(seedBannerImagesStatement);
  await pool.query(backfillBannerDiscountBadgeStatement);
  await seedAdminUsersFromEnv(pool);
  for (const record of splitSiteConfigRecords(defaultSiteConfig)) {
    await pool.execute(
      `INSERT INTO app_config (\`key\`, \`value\`, is_active, created_at, updated_at)
       VALUES (?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         \`value\` = JSON_MERGE_PATCH(VALUES(\`value\`), \`value\`),
         is_active = 1,
         updated_at = NOW()`,
      [record.key, JSON.stringify(record.value)]
    );
  }
  await pool.execute("DELETE FROM app_config WHERE `key` = ?", ["site"]);
}

async function updateAdminRoleConstraint(pool: Pool) {
  try {
    const [rows] = await pool.query(
      `SELECT cc.constraint_name
       FROM information_schema.check_constraints cc
       JOIN information_schema.table_constraints tc
         ON tc.constraint_schema = cc.constraint_schema
        AND tc.constraint_name = cc.constraint_name
       WHERE tc.table_schema = DATABASE()
         AND tc.table_name = 'admin_users'
         AND tc.constraint_type = 'CHECK'
         AND LOWER(cc.check_clause) LIKE '%role%'
         AND LOWER(cc.check_clause) LIKE '%super_admin%'`
    );

    const constraints = Array.isArray(rows)
      ? (rows as Array<{ constraint_name?: string }>)
      : [];

    for (const constraint of constraints) {
      if (!constraint.constraint_name) continue;
      const name = constraint.constraint_name.replace(/`/g, "``");
      await pool.query(`ALTER TABLE admin_users DROP CONSTRAINT \`${name}\``);
    }

    await pool.query(
      `ALTER TABLE admin_users
       ADD CONSTRAINT chk_admin_users_role
       CHECK (role IN ('admin', 'super_admin', 'client_admin', 'seller_admin'))`
    );
  } catch {
    // Older local databases can keep running even if generated CHECK names vary.
  }
}

async function allowCompanyReviews(pool: Pool) {
  try {
    await pool.query("ALTER TABLE reviews MODIFY product_id CHAR(36) NULL");
  } catch {
    // Older schemas may already allow NULL, or the FK name may vary by database.
  }
}

async function updateOrderStatusConstraint(pool: Pool) {
  try {
    const [rows] = await pool.query(
      `SELECT cc.constraint_name
       FROM information_schema.check_constraints cc
       JOIN information_schema.table_constraints tc
         ON tc.constraint_schema = cc.constraint_schema
        AND tc.constraint_name = cc.constraint_name
       WHERE tc.table_schema = DATABASE()
         AND tc.table_name = 'orders'
         AND tc.constraint_type = 'CHECK'
         AND LOWER(cc.check_clause) LIKE '%status%'
         AND LOWER(cc.check_clause) LIKE '%confirmed%'`
    );

    const constraints = Array.isArray(rows)
      ? (rows as Array<{ constraint_name?: string }>)
      : [];

    for (const constraint of constraints) {
      if (!constraint.constraint_name) continue;
      const name = constraint.constraint_name.replace(/`/g, "``");
      await pool.query(`ALTER TABLE orders DROP CONSTRAINT \`${name}\``);
    }

    await pool.query(
      `ALTER TABLE orders
       ADD CONSTRAINT chk_orders_status
       CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'refund_requested', 'refund_approved', 'refund_rejected', 'refunded'))`
    );
  } catch {
    // Older local databases can keep running even if their SQL dialect names
    // generated CHECK constraints differently.
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120000;
  const keyLength = 32;
  const digest = "sha256";
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `${iterations}:${salt}:${hash}`;
}

async function seedAdminUsersFromEnv(pool: Pool) {
  const runtime = getAdminRuntimeProperties();
  const seeds = [
    {
      username: runtime.username?.trim(),
      password: runtime.password?.trim(),
      role: "super_admin" as const,
    },
    {
      username: runtime.readUsername?.trim(),
      password: runtime.readPassword?.trim(),
      role: "admin" as const,
    },
  ];

  for (const seed of seeds) {
    if (!seed.username || !seed.password) continue;

    const [rows] = await pool.query(
      `SELECT 1 FROM admin_users WHERE username = ? LIMIT 1`,
      [seed.username]
    );
    if (Array.isArray(rows) && rows.length) continue;

    await pool.query(
      `INSERT INTO admin_users
         (id, username, full_name, password_hash, role, created_at, updated_at)
       VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())`,
      [seed.username, seed.username, hashPassword(seed.password), seed.role]
    );
  }
}

async function addColumnIfMissing(
  pool: Pool,
  tableName: string,
  columnName: string,
  statement: string
) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  if (Array.isArray(rows) && rows.length) return;

  await pool.query(statement);
}

async function createIndexIfMissing(
  pool: Pool,
  tableName: string,
  indexName: string,
  statement: string
) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND index_name = ?
     LIMIT 1`,
    [tableName, indexName]
  );

  if (Array.isArray(rows) && rows.length) return;

  await pool.query(statement);
}
