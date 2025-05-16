import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { useColorScheme } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const colorScheme = useColorScheme();
  
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

  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#F8F8F8',
          }
        }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </CartProvider>
    </AuthProvider>
  );
}