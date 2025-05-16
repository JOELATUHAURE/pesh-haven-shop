import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '@/types/supabase';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { addToWishlist, removeFromWishlist } from '@/lib/supabase';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  isWishlist?: boolean;
}

export function ProductCard({ product, onAddToCart, isWishlist = false }: ProductCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session, user } = useAuth();
  
  // Find primary image or use first image if no primary image is set
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.image_url || 'https://via.placeholder.com/300x300?text=No+Image';
  
  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };
  
  const handleWishlistToggle = async () => {
    if (!session?.user) {
      router.push('/auth');
      return;
    }
    
    try {
      if (isWishlist) {
        await removeFromWishlist(session.user.id, product.id);
      } else {
        await addToWishlist(session.user.id, product.id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {session?.user && (
          <TouchableOpacity
            style={[styles.wishlistButton, isWishlist ? { backgroundColor: colors.primary } : {}]}
            onPress={handleWishlistToggle}
          >
            <Heart 
              size={16}
              color={isWishlist ? '#FFFFFF' : colors.primary}
              fill={isWishlist ? '#FFFFFF' : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.details}>
        <Text 
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {product.title}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            UGX {product.price.toLocaleString()}
          </Text>
          
          {user?.user_type === 'wholesale' && product.wholesale_price && (
            <Text style={[styles.wholesalePrice, { color: colors.info }]}>
              UGX {product.wholesale_price.toLocaleString()}
            </Text>
          )}
        </View>
        
        {product.stock <= 0 ? (
          <Text style={[styles.outOfStock, { color: colors.error }]}>Out of Stock</Text>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
            onPress={onAddToCart}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 24; // Adjust for margins

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    margin: 8,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  wholesalePrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  addToCartButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});