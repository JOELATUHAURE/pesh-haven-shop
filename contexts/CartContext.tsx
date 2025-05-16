import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '@/types/supabase';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isWholesalePricing: boolean;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalAmount: 0,
  isWholesalePricing: false,
});

export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user, isWholesale } = useAuth();

  // Determine if wholesale pricing should be used
  const isWholesalePricing = isWholesale;

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await AsyncStorage.getItem('cart');
        if (cartData) {
          setCart(JSON.parse(cartData));
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    };
    
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    };
    
    saveCart();
  }, [cart]);

  // Add product to cart
  const addToCart = (product: Product, quantity: number) => {
    setCart(currentCart => {
      const existingItemIndex = currentCart.findIndex(item => 
        item.product.id === product.id
      );
      
      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        // Item doesn't exist, add new item
        return [...currentCart, { product, quantity }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart(currentCart => 
      currentCart.filter(item => item.product.id !== productId)
    );
  };

  // Update quantity for a product
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(currentCart => 
      currentCart.map(item => 
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total items in cart
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Calculate total amount
  const totalAmount = cart.reduce((total, item) => {
    const itemPrice = isWholesalePricing && item.product.wholesale_price && item.quantity >= item.product.wholesale_min_qty
      ? item.product.wholesale_price
      : item.product.price;
      
    return total + (itemPrice * item.quantity);
  }, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
    isWholesalePricing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};