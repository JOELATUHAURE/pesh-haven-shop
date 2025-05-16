import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView,
  useColorScheme,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { PromotionBanner } from '@/components/ui/PromotionBanner';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { getActivePromotions, getCategories, getFeaturedProducts, getTrendingProducts } from '@/lib/supabase';
import { Category, Product, Promotion } from '@/types/supabase';
import { useCart } from '@/contexts/CartContext';

export default function HomeScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchData = async () => {
    try {
      const [promotionsRes, categoriesRes, featuredRes, trendingRes] = await Promise.all([
        getActivePromotions(),
        getCategories(),
        getFeaturedProducts(8),
        getTrendingProducts(8)
      ]);
      
      setPromotions(promotionsRes.data || []);
      setCategories(categoriesRes.data || []);
      setFeaturedProducts(featuredRes.data || []);
      setTrendingProducts(trendingRes.data || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };
  
  const renderPromotionItem = ({ item }: { item: Promotion }) => (
    <PromotionBanner promotion={item} />
  );
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: colors.primary }]}>PESH HAVEN</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Baking & General Merchandise</Text>
        </View>
        
        {/* Promotions Carousel */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <FlatList
              data={promotions}
              renderItem={renderPromotionItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToAlignment="center"
              snapToInterval={promotions.length > 1 ? undefined : 1}
              decelerationRate="fast"
              contentContainerStyle={styles.promotionsContainer}
            />
          </View>
        )}
        
        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
            <Button 
              title="View All" 
              onPress={() => router.push('/search')}
              variant="ghost" 
              size="small" 
              color="primary"
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </ScrollView>
        </View>
        
        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Products</Text>
              <Button 
                title="View All" 
                onPress={() => router.push('/search?filter=featured')}
                variant="ghost" 
                size="small" 
                color="primary"
              />
            </View>
            
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </View>
          </View>
        )}
        
        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Products</Text>
              <Button 
                title="View All" 
                onPress={() => router.push('/search?filter=trending')}
                variant="ghost" 
                size="small" 
                color="primary"
              />
            </View>
            
            <View style={styles.productsGrid}>
              {trendingProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.gray }]}>
            © 2025 PESH HAVEN • Mbarara City, Uganda
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  promotionsContainer: {
    paddingVertical: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
});