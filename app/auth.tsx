import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { signIn, verifyOtp, signInWithGoogle } from '@/lib/supabase';
import { X } from 'lucide-react-native';

enum AuthStep {
  PHONE_INPUT,
  OTP_VERIFICATION,
}

export default function AuthScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState(AuthStep.PHONE_INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }
    
    let formattedPhone = phone;
    // Check if the phone number format needs to be adjusted
    if (!phone.startsWith('+256')) {
      // If it starts with 0, remove it and add +256
      if (phone.startsWith('0')) {
        formattedPhone = `+256${phone.substring(1)}`;
      } else {
        formattedPhone = `+256${phone}`;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(formattedPhone);
      
      if (error) throw error;
      
      // Move to OTP verification step
      setAuthStep(AuthStep.OTP_VERIFICATION);
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await verifyOtp(phone, otp);
      
      if (error) throw error;
      
      // Close the auth modal on successful verification
      router.back();
    } catch (error: any) {
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      const { error, data } = await signInWithGoogle();
      
      if (error) throw error;
      
      // The auth state change will handle navigation if successful
    } catch (error: any) {
      Alert.alert('Error', 'Google sign-in is not available on this platform');
    }
  };
  
  const handleBack = () => {
    if (authStep === AuthStep.OTP_VERIFICATION) {
      setAuthStep(AuthStep.PHONE_INPUT);
      setError(null);
    } else {
      router.back();
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>PESH HAVEN</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {authStep === AuthStep.PHONE_INPUT 
                ? 'Sign in to your account' 
                : 'Verify your phone number'}
            </Text>
            
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.toast.error }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {authStep === AuthStep.PHONE_INPUT ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                    placeholder="e.g. 0751234567"
                    placeholderTextColor={colors.gray}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                  <Text style={[styles.inputHelp, { color: colors.gray }]}>
                    We'll send you a one-time verification code
                  </Text>
                </View>
                
                <Button
                  title="Continue with Phone"
                  onPress={handleSendOtp}
                  variant="solid"
                  color="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || !phone}
                />
                
                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  <Text style={[styles.dividerText, { color: colors.gray }]}>OR</Text>
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                </View>
                
                <Button
                  title="Continue with Google"
                  onPress={handleGoogleSignIn}
                  variant="outline"
                  color="primary"
                  size="large"
                  fullWidth
                />
              </>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Enter OTP Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.gray}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={[styles.inputHelp, { color: colors.gray }]}>
                  A 6-digit code has been sent to your phone
                </Text>
                
                <Button
                  title="Verify Code"
                  onPress={handleVerifyOtp}
                  variant="solid"
                  color="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || otp.length < 6}
                  style={{ marginTop: 16 }}
                />
                
                <TouchableOpacity 
                  style={styles.resendLink}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={[styles.resendText, { color: colors.primary }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 4,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B71C1C',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  inputHelp: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  resendLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
});