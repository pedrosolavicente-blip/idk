-- ============================================================================
-- SHOWCASE SYSTEM (Existing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS showcase_posts (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  image_key   TEXT    NOT NULL,
  caption     TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  post_type   TEXT    NOT NULL DEFAULT 'image',
  livery_key  TEXT
);

CREATE TABLE IF NOT EXISTS showcase_comments (
  id          TEXT    PRIMARY KEY,
  post_id     TEXT    NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  body        TEXT    NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id     TEXT    NOT NULL,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  value       INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_views (
  id          TEXT    PRIMARY KEY,
  post_id     TEXT    NOT NULL,
  user_id     TEXT,
  username    TEXT,
  avatar      TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON showcase_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON showcase_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_views_post    ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post    ON post_likes(post_id);

-- ============================================================================
-- SHOP SYSTEM (New Production-Ready Schema)
-- ============================================================================

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
  id              TEXT    PRIMARY KEY,
  discord_id      TEXT    UNIQUE NOT NULL,
  username        TEXT    NOT NULL,
  global_name     TEXT,
  avatar          TEXT,
  email           TEXT,
  role            TEXT    NOT NULL DEFAULT 'member', -- 'member', 'admin', 'super_admin'
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Categories for product organization
CREATE TABLE IF NOT EXISTS categories (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL UNIQUE,
  slug            TEXT    NOT NULL UNIQUE,
  description     TEXT,
  icon            TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Tags for flexible product tagging
CREATE TABLE IF NOT EXISTS tags (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL UNIQUE,
  slug            TEXT    NOT NULL UNIQUE,
  color           TEXT,
  created_at      INTEGER NOT NULL
);

-- Product tags junction table
CREATE TABLE IF NOT EXISTS product_tags (
  product_id      TEXT    NOT NULL,
  tag_id          TEXT    NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Products table with all required fields
CREATE TABLE IF NOT EXISTS products (
  id              TEXT    PRIMARY KEY,
  title           TEXT    NOT NULL,
  subtitle        TEXT,
  slug            TEXT    NOT NULL UNIQUE,
  description     TEXT    NOT NULL,
  category_id     TEXT,
  price_gbp       REAL    NOT NULL,
  original_price_gbp REAL,
  currency        TEXT    NOT NULL DEFAULT 'GBP',
  
  -- Product flags
  is_featured     INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  is_new          INTEGER NOT NULL DEFAULT 0,
  is_on_sale      INTEGER NOT NULL DEFAULT 0,
  in_stock        INTEGER NOT NULL DEFAULT 1,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  
  -- Product details
  badge           TEXT,
  specifications  TEXT, -- JSON string
  shipping_info   TEXT,
  return_policy   TEXT,
  
  -- Rating system
  rating          REAL    NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  image_urls      TEXT, -- JSON array of image URLs
  thumbnail_url   TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  created_by      TEXT, -- user_id of creator
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id              TEXT    PRIMARY KEY,
  product_id      TEXT    NOT NULL,
  name            TEXT    NOT NULL,
  price_gbp       REAL,
  in_stock        INTEGER NOT NULL DEFAULT 1,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL,
  product_id      TEXT    NOT NULL,
  variant_id      TEXT,
  created_at      INTEGER NOT NULL,
  UNIQUE(user_id, product_id, variant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT,
  order_number    TEXT    NOT NULL UNIQUE,
  
  -- Order details
  status          TEXT    NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  payment_method  TEXT    NOT NULL, -- 'paypal', 'roblox'
  payment_id      TEXT,
  payment_status  TEXT    NOT NULL DEFAULT 'pending',
  
  -- Pricing
  subtotal_gbp    REAL    NOT NULL,
  shipping_gbp    REAL    NOT NULL DEFAULT 0,
  tax_gbp         REAL    NOT NULL DEFAULT 0,
  total_gbp       REAL    NOT NULL,
  currency        TEXT    NOT NULL DEFAULT 'GBP',
  
  -- Shipping
  shipping_name   TEXT,
  shipping_email  TEXT,
  shipping_address TEXT, -- JSON string
  
  -- Timestamps
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  paid_at         INTEGER,
  shipped_at      INTEGER,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id              TEXT    PRIMARY KEY,
  order_id        TEXT    NOT NULL,
  product_id      TEXT    NOT NULL,
  variant_id      TEXT,
  product_name    TEXT    NOT NULL,
  product_image   TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  price_gbp       REAL    NOT NULL,
  total_gbp       REAL    NOT NULL,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Product reviews
CREATE TABLE IF NOT EXISTS reviews (
  id              TEXT    PRIMARY KEY,
  product_id      TEXT    NOT NULL,
  user_id         TEXT    NOT NULL,
  username        TEXT    NOT NULL,
  avatar          TEXT,
  rating          INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title           TEXT,
  content         TEXT    NOT NULL,
  is_verified     INTEGER NOT NULL DEFAULT 0,
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
  review_id       TEXT    NOT NULL,
  user_id         TEXT    NOT NULL,
  is_helpful      INTEGER NOT NULL,
  created_at      INTEGER NOT NULL,
  PRIMARY KEY (review_id, user_id),
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_discord ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, is_active) WHERE is_featured = 1 AND is_active = 1;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_gbp);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = 1;

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag_id);
