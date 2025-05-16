import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Bell,
  Tag,
  Settings,
  LogOut,
} from 'lucide-react-native';

export default function AdminDashboard() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  const fetchDashboardStats = async () => {
    try {
      // Fetch total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });
      
      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' });
      
      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .neq('user_type', 'admin');
      
      // Calculate total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid');
      
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      setStats({
        totalOrders: ordersCount || 0,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const menuItems = [
    {
      title: 'Products',
      icon: <Package size={24} color={colors.primary} />,
      route: '/admin/products',
      description: 'Manage your product catalog',
    },
    {
      title: 'Orders',
      icon: <ShoppingBag size={24} color={colors.primary} />,
      route: '/admin/orders',
      description: 'View and manage orders',
    },
    {
      title: 'Customers',
      icon: <Users size={24} color={colors.primary} />,
      route: '/admin/customers',
      description: 'Customer management',
    },
    {
      title: 'Analytics',
      icon: <TrendingUp size={24} color={colors.primary} />,
      route: '/admin/analytics',
      description: 'Sales and performance metrics',
    },
    {
      title: 'Promotions',
      icon: <Tag size={24} color={colors.primary} />,
      route: '/admin/promotions',
      description: 'Manage promotional campaigns',
    },
    {
      title: 'Notifications',
      icon: <Bell size={24} color={colors.primary} />,
      route: '/admin/notifications',
      description: 'Send push notifications',
    },
    {
      title: 'Settings',
      icon: <Settings size={24} color={colors.primary} />,
      route: '/admin/settings',
      description: 'System configuration',
    },
  ];
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Orders</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>
            {stats.totalOrders}
          </Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Products</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>
            {stats.totalProducts}
          </Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Customers</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>
            {stats.totalCustomers}
          </Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Revenue</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>
            UGX {stats.totalRevenue.toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.divider }]}
            onPress={() => router.push(item.route)}
          >
            {item.icon}
            <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.menuDescription, { color: colors.gray }]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
        onPress={() => {
          supabase.auth.signOut();
          router.replace('/');
        }}
      >
        <LogOut size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statsCard: {
    width: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  menuCard: {
    width: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});