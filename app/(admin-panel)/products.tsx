import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/supabase';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

const ITEMS_PER_PAGE = 10;

export default function AdminProductsScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [page, searchQuery, selectedCategory]);
  
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
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, image_url, is_primary)
        `, { count: 'exact' });
      
      // Apply search filter
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      // Apply pagination
      query = query
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setProducts(data || []);
      setTotalProducts(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteProduct = async (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);
                
              if (error) throw error;
              
              // Refresh products list
              fetchProducts();
              
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };
  
  const renderProductItem = ({ item }: { item: Product }) => {
    const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
    const imageUrl = primaryImage?.image_url || 'https://via.placeholder.com/100x100?text=No+Image';
    
    return (
      <View style={[styles.productItem, { backgroundColor: colors.card, borderColor: colors.divider }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
        />
        
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={[styles.productCategory, { color: colors.gray }]}>
            {item.category?.name || 'No Category'}
          </Text>
          
          <View style={styles.productDetails}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              UGX {item.price.toLocaleString()}
            </Text>
            
            <Text style={[
              styles.stockStatus, 
              { color: item.stock > 0 ? colors.success : colors.error }
            ]}>
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => router.push(`/admin/products/${item.id}`)}
          >
            <Edit size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleDeleteProduct(item)}
            disabled={isDeleting}
          >
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Products
        </Text>
        
        <Button
          title="Add Product"
          onPress={() => router.push('/admin/products/new')}
          variant="solid"
          color="primary"
          size="small"
          icon={<Plus size={18} color="#FFFFFF" />}
          iconPosition="left"
        />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Search size={20} color={colors.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
          onPress={() => {
            // Show category filter modal or dropdown
          }}
        >
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null 
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.card, borderColor: colors.divider }
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              { color: selectedCategory === null ? '#FFFFFF' : colors.text }
            ]}
          >
            All Categories
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.divider }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === category.id ? '#FFFFFF' : colors.text }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No products found
          </Text>
          <Button
            title="Add New Product"
            onPress={() => router.push('/admin/products/new')}
            variant="outline"
            color="primary"
            size="medium"
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Pagination */}
          <View style={[styles.pagination, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.pageButton,
                { opacity: page === 0 ? 0.5 : 1 }
              ]}
              onPress={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.pageText, { color: colors.text }]}>
              Page {page + 1} of {totalPages}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.pageButton,
                { opacity: page >= totalPages - 1 ? 0.5 : 1 }
              ]}
              onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  productList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  stockStatus: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  productActions: {
    marginLeft: 12,
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  pageButton: {
    padding: 8,
  },
  pageText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});