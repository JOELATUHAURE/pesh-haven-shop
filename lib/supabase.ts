import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wjmbrxcljvqwjhzinfoa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbWJyeGNsanZxd2poemluZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODc0NTAsImV4cCI6MjA2Mjk2MzQ1MH0.pdJfXyFzHbA4Bn8oETCzsWfWfI8XK3GqR4_Grz6UfnE';

const getStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use localStorage
    return {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve(undefined);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve(undefined);
      },
    };
  }
  // For native, use AsyncStorage
  return AsyncStorage;
};

// Initialize Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helpers
export const signIn = async (phone: string) => {
  // Format the phone number to ensure it has the Ugandan country code
  let formattedPhone = phone;
  if (!phone.startsWith('+256')) {
    formattedPhone = `+256${phone.replace(/^0+/, '')}`;
  }
  
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });
  
  return { data, error };
};

export const verifyOtp = async (phone: string, otp: string) => {
  let formattedPhone = phone;
  if (!phone.startsWith('+256')) {
    formattedPhone = `+256${phone.replace(/^0+/, '')}`;
  }
  
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: otp,
    type: 'sms',
  });
  
  return { data, error };
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Google Sign-In
export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
};

// User profile helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
    
  return { data, error };
};

// Product helpers
export const getProducts = async (limit = 20, offset = 0, categoryId?: string) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      images:product_images(id, image_url, is_primary)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  
  return { data, error };
};

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      images:product_images(id, image_url, is_primary),
      reviews:reviews(id, user_id, rating, comment, created_at, profiles:profiles(id, full_name, avatar_url))
    `)
    .eq('id', id)
    .single();
    
  return { data, error };
};

export const getFeaturedProducts = async (limit = 10) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      images:product_images(id, image_url, is_primary)
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return { data, error };
};

export const getTrendingProducts = async (limit = 10) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      images:product_images(id, image_url, is_primary)
    `)
    .eq('is_trending', true)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return { data, error };
};

// Category helpers
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
    
  return { data, error };
};

// Order helpers
export const createOrder = async (order: any, orderItems: any[]) => {
  // First, create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
    
  if (orderError) return { data: null, error: orderError };
  
  // Then, add the order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: orderData.id
  }));
  
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithOrderId);
    
  return { 
    data: { order: orderData, items: itemsData }, 
    error: itemsError 
  };
};

export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        id,
        quantity,
        unit_price,
        product:products(id, title)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  return { data, error };
};

// Wishlist helpers
export const addToWishlist = async (userId: string, productId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .insert({ user_id: userId, product_id: productId })
    .select();
    
  return { data, error };
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .delete()
    .match({ user_id: userId, product_id: productId });
    
  return { data, error };
};

export const getUserWishlist = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id,
      product_id,
      product:products(
        id, 
        title, 
        price,
        images:product_images(id, image_url, is_primary)
      )
    `)
    .eq('user_id', userId);
    
  return { data, error };
};

// Reviews helpers
export const addReview = async (review: any) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select();
    
  return { data, error };
};

// Promotions helpers
export const getActivePromotions = async () => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });
    
  return { data, error };
};

// Notifications helpers
export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  return { data, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();
    
  return { data, error };
};