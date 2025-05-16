import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'expo-image';
import { Trash2, CircleMinus as MinusCircle, CirclePlus as PlusCircle } from 'lucide-react-native';
import { CartItem } from '@/types/supabase';

export default function CartScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount, isWholesalePricing } = useCart();
  const { session } = useAuth();

  const handleCheckout = () => {
    if (!session) {
      // User is not logged in
      Alert.alert(
        'Authentication Required',
        'Please log in or sign up to proceed to checkout',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }
    
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart before checkout');
      return;
    }
    
    router.push('/checkout');
  };
  
  const renderCartItem = ({ item }: { item: CartItem }) => {
    // Find primary image or use first image
    const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
    const imageUrl = primaryImage?.image_url || 'https://via.placeholder.com/300x300?text=No+Image';
    
    // Determine price based on user type and quantity
    const itemPrice = isWholesalePricing && item.product.wholesale_price && item.quantity >= item.product.wholesale_min_qty
      ? item.product.wholesale_price
      : item.product.price;
    
    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          contentFit="cover"
        />
        
        <View style={styles.productDetails}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.product.title}
          </Text>
          
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            UGX {itemPrice.toLocaleString()}
          </Text>
          
          {isWholesalePricing && item.product.wholesale_price && (
            <Text style={[styles.wholesaleNote, { color: colors.info }]}>
              {item.quantity >= item.product.wholesale_min_qty 
                ? 'Wholesale price applied'
                : `Buy ${item.product.wholesale_min_qty}+ for wholesale price`}
            </Text>
          )}
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              style={{ opacity: item.quantity <= 1 ? 0.5 : 1 }}
            >
              <MinusCircle size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.quantityText, { color: colors.text }]}>
              {item.quantity}
            </Text>
            
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
            >
              <PlusCircle size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromCart(item.product.id)}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => clearCart()}>
            <Text style={[styles.clearCartText, { color: colors.error }]}>Clear Cart</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={64} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Your cart is empty
          </Text>
          <Button
            title="Browse Products"
            onPress={() => router.push('/')}
            variant="outline"
            color="primary"
            size="medium"
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.cartList}
          />
          
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Items:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{totalItems}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                UGX {totalAmount.toLocaleString()}
              </Text>
            </View>
            
            <Button
              title="Proceed to Checkout"
              onPress={handleCheckout}
              variant="solid"
              color="primary"
              size="large"
              fullWidth
              style={{ marginTop: 16 }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  clearCartText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    marginTop: 16,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  wholesaleNote: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  summary: {
    padding: 16,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
});