import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ChevronLeft, CreditCard, Phone } from 'lucide-react-native';
import { createOrder } from '@/lib/supabase';

enum PaymentMethod {
  MTN_MOBILE_MONEY = 'mtn_mobile_money',
  AIRTEL_MONEY = 'airtel_money',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export default function CheckoutScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session, user } = useAuth();
  const { cart, totalAmount, clearCart } = useCart();
  
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Mbarara');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MTN_MOBILE_MONEY);
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!session || !user) {
    router.replace('/auth');
    return null;
  }
  
  if (cart.length === 0) {
    router.replace('/cart');
    return null;
  }
  
  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.MTN_MOBILE_MONEY:
        return 'MTN Mobile Money';
      case PaymentMethod.AIRTEL_MONEY:
        return 'Airtel Money';
      case PaymentMethod.CASH_ON_DELIVERY:
        return 'Cash on Delivery';
    }
  };
  
  const handleSubmitOrder = async () => {
    if (!address) {
      Alert.alert('Error', 'Please enter your delivery address');
      return;
    }
    
    if (!city) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    
    if (!phone) {
      Alert.alert('Error', 'Please enter your contact phone number');
      return;
    }
    
    if (paymentMethod !== PaymentMethod.CASH_ON_DELIVERY && !paymentPhone) {
      Alert.alert('Error', 'Please enter your mobile money phone number');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create order object
      const order = {
        user_id: session.user.id,
        total_amount: totalAmount,
        payment_status: 'pending',
        payment_method: paymentMethod,
        payment_reference: null,
        order_status: 'pending',
        shipping_address: address,
        shipping_city: city,
        shipping_phone: phone,
        notes: notes,
      };
      
      // Create order items from cart
      const orderItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));
      
      // Submit order to Supabase
      const { data, error } = await createOrder(order, orderItems);
      
      if (error) throw error;
      
      // Clear cart after successful order
      clearCart();
      
      // Show success alert
      Alert.alert(
        'Order Successful',
        'Your order has been placed successfully!',
        [
          { 
            text: 'View Orders',
            onPress: () => {
              router.push('/orders');
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              router.push('/');
            }
          }
        ]
      );
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} /> {/* Empty space for balance */}
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Delivery Information
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Delivery Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your full address"
              placeholderTextColor={colors.gray}
              multiline
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
              value={city}
              onChangeText={setCity}
              placeholder="Enter your city"
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Contact Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.gray}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Order Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions for delivery"
              placeholderTextColor={colors.gray}
              multiline
            />
          </View>
        </View>
        
        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment Method
          </Text>
          
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === PaymentMethod.MTN_MOBILE_MONEY && [styles.selectedPayment, { borderColor: colors.primary }],
                { backgroundColor: colors.card }
              ]}
              onPress={() => setPaymentMethod(PaymentMethod.MTN_MOBILE_MONEY)}
            >
              <View style={styles.paymentIcon}>
                <Phone size={24} color={colors.primary} />
              </View>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>
                MTN Mobile Money
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === PaymentMethod.AIRTEL_MONEY && [styles.selectedPayment, { borderColor: colors.primary }],
                { backgroundColor: colors.card }
              ]}
              onPress={() => setPaymentMethod(PaymentMethod.AIRTEL_MONEY)}
            >
              <View style={styles.paymentIcon}>
                <Phone size={24} color={colors.error} />
              </View>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>
                Airtel Money
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === PaymentMethod.CASH_ON_DELIVERY && [styles.selectedPayment, { borderColor: colors.primary }],
                { backgroundColor: colors.card }
              ]}
              onPress={() => setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY)}
            >
              <View style={styles.paymentIcon}>
                <CreditCard size={24} color={colors.success} />
              </View>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>
                Cash on Delivery
              </Text>
            </TouchableOpacity>
          </View>
          
          {paymentMethod !== PaymentMethod.CASH_ON_DELIVERY && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {paymentMethod === PaymentMethod.MTN_MOBILE_MONEY ? 'MTN Mobile Money Number' : 'Airtel Money Number'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                value={paymentPhone}
                onChangeText={setPaymentPhone}
                placeholder="Enter your mobile money number"
                placeholderTextColor={colors.gray}
                keyboardType="phone-pad"
              />
              <Text style={[styles.helperText, { color: colors.gray }]}>
                You will receive a prompt to complete payment
              </Text>
            </View>
          )}
        </View>
        
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Order Summary
          </Text>
          
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.summaryItem}>
                <Text style={[styles.summaryItemName, { color: colors.text }]} numberOfLines={1}>
                  {item.quantity} x {item.product.title}
                </Text>
                <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                  UGX {(item.product.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            
            <View style={styles.summaryTotal}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.summaryTotalAmount, { color: colors.primary }]}>
                UGX {totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Place Order Button */}
        <Button
          title={isSubmitting ? 'Processing...' : `Pay with ${getPaymentMethodLabel(paymentMethod)}`}
          onPress={handleSubmitOrder}
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ marginTop: 24, marginBottom: 32 }}
        />
      </ScrollView>
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
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentOption: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPayment: {
    borderWidth: 2,
  },
  paymentIcon: {
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    flex: 1,
    marginRight: 8,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  summaryTotalAmount: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
});