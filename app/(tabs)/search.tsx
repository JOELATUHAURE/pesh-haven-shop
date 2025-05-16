import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { ProductCard } from '@/components/ui/ProductCard';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/supabase';
import { useCart } from '@/contexts/CartContext';
import { Search as SearchIcon, X, Filter } from 'lucide-react-native';

export default function SearchScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { addToCart } = useCart();
  const params = useLocalSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 20;
  
  useEffect(() => {
    // Fetch categories for the filter
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
    
    // Check if we have a filter from params
    if (params.category) {
      setSelectedCategory(params.category as string);
    } else if (params.filter) {
      // Special filters like "featured" or "trending"
      setSearchQuery('');
      fetchProducts(0, params.filter as string);
    }
  }, [params]);
  
  const fetchProducts = async (pageNum = 0, filterType?: string) => {
    if (pageNum === 0) {
      setIsLoading(true);
      setProducts([]);
    } else {
      setIsMoreLoading(true);
    }
    
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, image_url, is_primary)
        `)
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);
        
      // Apply search query if present
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      // Apply category filter if selected
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      // Apply special filters
      if (filterType === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filterType === 'trending') {
        query = query.eq('is_trending', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (pageNum === 0) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchProducts(0);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    fetchProducts(0);
  };
  
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(0);
    setTimeout(() => fetchProducts(0), 100);
  };
  
  const handleLoadMore = () => {
    if (!isMoreLoading && hasMore) {
      fetchProducts(page + 1);
    }
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };
  
  const renderFooter = () => {
    if (!isMoreLoading) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Search Products</Text>
      </View>
      
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <SearchIcon size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={handleClearSearch}>
            <X size={20} color={colors.gray} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === null ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.divider }
            ]}
            onPress={() => handleCategorySelect(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null ? { color: '#FFFFFF' } : { color: colors.text }
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.divider }
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id ? { color: '#FFFFFF' } : { color: colors.text }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard 
              product={item} 
              onAddToCart={() => handleAddToCart(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No products found
              </Text>
            </View>
          }
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  categoryFilter: {
    padding: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
});