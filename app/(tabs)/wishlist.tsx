import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';
import { Heart } from 'lucide-react-native';
import { getUserWishlist, removeFromWishlist } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { WishlistItem } from '@/types/supabase';

export default function WishlistScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  const { addToCart } = useCart();
  
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchWishlist = async () => {
    if (!session?.user) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await getUserWishlist(session.user.id);
      if (error) throw error;
      
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchWishlist();
  }, [session]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };
  
  const handleRemoveFromWishlist = async (productId: string) => {
    if (!session?.user) return;
    
    try {
      await removeFromWishlist(session.user.id, productId);
      // Update local state
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };
  
  const handleAddToCart = (item: WishlistItem) => {
    if (item.product) {
      addToCart(item.product, 1);
    }
  };
  
  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Wishlist</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Heart size={64} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Please log in to view your wishlist
          </Text>
          <Button
            title="Log In"
            onPress={() => router.push('/auth')}
            variant="solid"
            color="primary"
            size="medium"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Wishlist</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Your wishlist is empty
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
        <FlatList
          data={wishlistItems}
          renderItem={({ item }) => (
            item.product ? (
              <ProductCard 
                product={item.product} 
                onAddToCart={() => handleAddToCart(item)}
                isWishlist
              />
            ) : null
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
});