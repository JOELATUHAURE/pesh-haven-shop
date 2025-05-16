export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'retail' | 'wholesale' | 'admin';
  address: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  is_featured: boolean;
  is_trending: boolean;
  avg_rating: number;
  wholesale_price: number | null;
  wholesale_min_qty: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed';
  payment_method: string | null;
  payment_reference: string | null;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: 'info' | 'order' | 'promotion' | 'other';
  link: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}