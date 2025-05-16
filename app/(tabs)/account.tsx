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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { signOut, getUserOrders } from '@/lib/supabase';
import { Image } from 'expo-image';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  LogOut, 
  ChevronRight,
  Bell,
  Settings,
  Phone,
} from 'lucide-react-native';
import { Order } from '@/types/supabase';

export default function AccountScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session, user, isAdmin } = useAuth();
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  
  useEffect(() => {
    if (session?.user) {
      fetchRecentOrders();
    }
  }, [session]);
  
  const fetchRecentOrders = async () => {
    if (!session?.user) return;
    
    setIsOrdersLoading(true);
    try {
      const { data, error } = await getUserOrders(session.user.id);
      if (error) throw error;
      
      // Get the 3 most recent orders
      setRecentOrders((data || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // No need to navigate, auth state change will update UI
          }
        }
      ]
    );
  };
  
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'processing': return colors.info;
      case 'shipped': return colors.primary;
      case 'delivered': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.gray;
    }
  };
  
  if (!session || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        </View>
        
        <View style={styles.authContainer}>
          <User size={64} color={colors.gray} />
          <Text style={[styles.authText, { color: colors.text }]}>
            Please log in to access your account
          </Text>
          <Button
            title="Log In"
            onPress={() => router.push('/auth')}
            variant="solid"
            color="primary"
            size="large"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        </View>
        
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: user.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
              contentFit="cover"
            />
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user.full_name || 'User'}
              </Text>
              
              <Text style={[styles.profileEmail, { color: colors.gray }]}>
                {user.phone || 'No phone added'}
              </Text>
              
              <View style={[styles.userTypeTag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.userTypeText, { color: colors.primary }]}>
                  {user.user_type === 'wholesale' ? 'Wholesale Customer' : 'Retail Customer'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]}>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
              <ShoppingBag size={20} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Orders</Text>
              <ChevronRight size={20} color={colors.gray} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/wishlist')}>
              <Heart size={20} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Wishlist</Text>
              <ChevronRight size={20} color={colors.gray} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            
            <TouchableOpacity style={styles.menuItem}>
              <Bell size={20} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
              <ChevronRight size={20} color={colors.gray} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            
            <TouchableOpacity style={styles.menuItem}>
              <Phone size={20} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Contact Us</Text>
              <ChevronRight size={20} color={colors.gray} />
            </TouchableOpacity>
            
            {isAdmin && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    // Admin dashboard link - should open web browser to admin panel
                  }}
                >
                  <Settings size={20} color={colors.info} />
                  <Text style={[styles.menuItemText, { color: colors.info }]}>Admin Dashboard</Text>
                  <ChevronRight size={20} color={colors.gray} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
          
          {isOrdersLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={[styles.emptyOrdersContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
              <Text style={[styles.emptyOrdersText, { color: colors.text }]}>
                You haven't placed any orders yet
              </Text>
              
              <Button
                title="Browse Products"
                onPress={() => router.push('/')}
                variant="outline"
                color="primary"
                size="small"
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <View style={[styles.ordersCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
              {recentOrders.map((order, index) => (
                <React.Fragment key={order.id}>
                  <TouchableOpacity 
                    style={styles.orderItem}
                    onPress={() => router.push(`/order/${order.id}`)}
                  >
                    <View>
                      <Text style={[styles.orderNumber, { color: colors.text }]}>
                        Order #{order.id.substring(0, 8)}
                      </Text>
                      
                      <Text style={[styles.orderDate, { color: colors.gray }]}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </Text>
                      
                      <View style={styles.orderDetails}>
                        <Text style={[styles.orderTotal, { color: colors.primary }]}>
                          UGX {order.total_amount.toLocaleString()}
                        </Text>
                        
                        <View style={[
                          styles.orderStatus, 
                          { backgroundColor: getOrderStatusColor(order.order_status) + '20' }
                        ]}>
                          <Text style={[
                            styles.orderStatusText, 
                            { color: getOrderStatusColor(order.order_status) }
                          ]}>
                            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <ChevronRight size={20} color={colors.gray} />
                  </TouchableOpacity>
                  
                  {index < recentOrders.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  )}
                </React.Fragment>
              ))}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/orders')}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All Orders
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            color="error"
            size="medium"
            icon={<LogOut size={18} color={colors.error} />}
            iconPosition="left"
            style={{ marginHorizontal: 16 }}
          />
        </View>
        
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
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  userTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  userTypeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  menuCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginLeft: 12,
  },
  divider: {
    height: 1,
  },
  ordersCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyOrdersContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
  },
  emptyOrdersText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginRight: 8,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
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