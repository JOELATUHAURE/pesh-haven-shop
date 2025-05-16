import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, Star, CircleMinus as MinusCircle, CirclePlus as PlusCircle, ShoppingCart, User } from 'lucide-react-native';
import { getProductById, addToWishlist, removeFromWishlist } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Product, Review } from '@/types/supabase';

export default function ProductDetailScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session, user, isWholesale } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  
  // Calculate if wholesale pricing applies
  const useWholesalePrice = isWholesale && 
    product?.wholesale_price && 
    quantity >= (product.wholesale_min_qty || 10);
    
  const price = useWholesalePrice 
    ? product?.wholesale_price 
    : product?.price;
  
  useEffect(() => {
    fetchProduct();
  }, [id]);
  
  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await getProductById(id as string);
      if (error) throw error;
      
      setProduct(data);
      
      // Check if product is in wishlist
      if (session?.user && data?.id) {
        checkWishlistStatus(data.id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkWishlistStatus = async (productId: string) => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .single();
        
      setIsInWishlist(!!data);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Show success message or feedback
    }
  };
  
  const handleToggleWishlist = async () => {
    if (!session?.user || !product) {
      router.push('/auth');
      return;
    }
    
    setIsAddingToWishlist(true);
    
    try {
      if (isInWishlist) {
        await removeFromWishlist(session.user.id, product.id);
        setIsInWishlist(false);
      } else {
        await addToWishlist(session.user.id, product.id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };
  
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (product && value > product.stock) return;
    
    setQuantity(value);
  };
  
  const renderImageItem = ({ item, index }: { item: any, index: number }) => (
    <Image
      source={{ uri: item.image_url }}
      style={styles.carouselImage}
      contentFit="cover"
    />
  );
  
  const renderImageIndicator = () => {
    if (!product?.images || product.images.length <= 1) return null;
    
    return (
      <View style={styles.indicatorContainer}>
        {product.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === activeImage ? colors.primary : colors.gray,
                width: index === activeImage ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };
  
  const renderReview = ({ item }: { item: Review }) => (
    <View style={[styles.reviewItem, { borderColor: colors.divider }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {item.profiles?.avatar_url ? (
            <Image
              source={{ uri: item.profiles.avatar_url }}
              style={styles.reviewAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.reviewAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <User size={16} color="#FFFFFF" />
            </View>
          )}
          
          <Text style={[styles.reviewUserName, { color: colors.text }]}>
            {item.profiles?.full_name || 'Anonymous'}
          </Text>
        </View>
        
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              color={star <= item.rating ? colors.warning : colors.lightGray}
              fill={star <= item.rating ? colors.warning : 'transparent'}
            />
          ))}
        </View>
      </View>
      
      {item.comment && (
        <Text style={[styles.reviewComment, { color: colors.text }]}>
          {item.comment}
        </Text>
      )}
      
      <Text style={[styles.reviewDate, { color: colors.gray }]}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Product not found
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleToggleWishlist} 
          style={[
            styles.wishlistButton,
            isInWishlist ? { backgroundColor: colors.primary } : {}
          ]}
          disabled={isAddingToWishlist}
        >
          {isAddingToWishlist ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Heart 
              size={20} 
              color={isInWishlist ? '#FFFFFF' : colors.primary}
              fill={isInWishlist ? '#FFFFFF' : 'transparent'}
            />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={product.images || [{ image_url: 'https://via.placeholder.com/500x500?text=No+Image' }]}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => item.id || `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const contentOffset = e.nativeEvent.contentOffset;
              const viewSize = e.nativeEvent.layoutMeasurement;
              const newIndex = Math.floor(contentOffset.x / viewSize.width);
              if (newIndex !== activeImage) {
                setActiveImage(newIndex);
              }
            }}
          />
          {renderImageIndicator()}
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]}>
            {product.title}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              UGX {price?.toLocaleString()}
            </Text>
            
            {isWholesale && product.wholesale_price && (
              <View style={[styles.wholesaleTag, { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.wholesaleTagText, { color: colors.info }]}>
                  {quantity >= product.wholesale_min_qty
                    ? 'Wholesale Price'
                    : `Min ${product.wholesale_min_qty} for wholesale`}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  color={star <= product.avg_rating ? colors.warning : colors.lightGray}
                  fill={star <= product.avg_rating ? colors.warning : 'transparent'}
                />
              ))}
            </View>
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {product.avg_rating.toFixed(1)} ({product.reviews?.length || 0} reviews)
            </Text>
          </View>
          
          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Text style={[
              styles.stockText, 
              { color: product.stock > 0 ? colors.success : colors.error }
            ]}>
              {product.stock > 0 
                ? `In Stock (${product.stock} available)` 
                : 'Out of Stock'}
            </Text>
            
            {product.category && (
              <TouchableOpacity 
                onPress={() => router.push(`/category/${product.category.id}`)}
                style={[styles.categoryTag, { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                  {product.category.name}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Quantity Selector */}
          {product.stock > 0 && (
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantityLabel, { color: colors.text }]}>Quantity:</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  style={{ opacity: quantity <= 1 ? 0.5 : 1 }}
                >
                  <MinusCircle size={28} color={colors.primary} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityValue, { color: colors.text }]}>
                  {quantity}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                  style={{ opacity: quantity >= product.stock ? 0.5 : 1 }}
                >
                  <PlusCircle size={28} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Add to Cart Button */}
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            variant="solid"
            color="primary"
            size="large"
            disabled={product.stock <= 0}
            icon={<ShoppingCart size={20} color="#FFFFFF" />}
            iconPosition="left"
            style={{ marginTop: 16 }}
            fullWidth
          />
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {product.description || 'No description available.'}
            </Text>
          </View>
          
          {/* Reviews */}
          <View style={styles.reviewsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reviews ({product.reviews?.length || 0})
            </Text>
            
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <View key={review.id} style={styles.reviewWrapper}>
                  {renderReview({ item: review })}
                </View>
              ))
            ) : (
              <Text style={[styles.noReviewsText, { color: colors.gray }]}>
                No reviews yet. Be the first to review this product!
              </Text>
            )}
            
            {session?.user && (
              <Button
                title="Write a Review"
                onPress={() => {
                  // Navigate to review form
                }}
                variant="outline"
                color="primary"
                size="medium"
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  wishlistButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  carouselContainer: {
    width: width,
    height: width,
  },
  carouselImage: {
    width: width,
    height: width,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginRight: 8,
  },
  wholesaleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  wholesaleTagText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
  },
  reviewsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  reviewWrapper: {
    marginBottom: 12,
  },
  reviewItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reviewAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  noReviewsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    marginTop: 8,
  },
});