/*
  # Initial Database Schema for PESH HAVEN

  1. New Tables
    - `profiles`: User profiles extended from auth.users
    - `categories`: Product categories with hierarchical structure
    - `products`: Product details including price, stock, and category
    - `product_images`: Images associated with products
    - `orders`: Customer orders with payment and delivery status
    - `order_items`: Individual items within an order
    - `reviews`: Product reviews from customers
    - `promotions`: Marketing promotions and banners
    - `wishlist`: Customer favorite products
    - `notifications`: System notifications for users
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'retail' CHECK (user_type IN ('retail', 'wholesale', 'admin')),
  address TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories"
  ON categories
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Only admins can update categories"
  ON categories
  FOR UPDATE
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Only admins can delete categories"
  ON categories
  FOR DELETE
  USING (auth.jwt() ->> 'user_type' = 'admin');

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  wholesale_price DECIMAL(10, 2),
  wholesale_min_qty INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert products"
  ON products
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Only admins can update products"
  ON products
  FOR UPDATE
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Only admins can delete products"
  ON products
  FOR DELETE
  USING (auth.jwt() ->> 'user_type' = 'admin');

-- PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Product images policies
CREATE POLICY "Product images are viewable by everyone"
  ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage product images"
  ON product_images
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = user_id AND order_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND order_status = 'pending');

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  USING ((SELECT user_id FROM orders WHERE id = order_id) = auth.uid() OR auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "Users can create own order items"
  ON order_items
  FOR INSERT
  WITH CHECK ((SELECT user_id FROM orders WHERE id = order_id) = auth.uid());

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Promotions are viewable by everyone"
  ON promotions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage promotions"
  ON promotions
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Wishlist policies
CREATE POLICY "Users can view own wishlist"
  ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
  ON wishlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'order', 'promotion', 'other')),
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'user_type' = 'admin');

-- Trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_promotions
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();