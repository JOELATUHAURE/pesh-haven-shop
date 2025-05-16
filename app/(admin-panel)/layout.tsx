import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Outlet, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function AdminPanelLayout() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session, user, isAdmin } = useAuth();
  
  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep the splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  // Check authentication and admin status
  if (!session || !user) {
    router.replace('/auth');
    return null;
  }
  
  if (!isAdmin) {
    router.replace('/');
    return null;
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Outlet />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});