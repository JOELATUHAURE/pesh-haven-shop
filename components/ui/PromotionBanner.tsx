import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Promotion } from '@/types/supabase';

interface PromotionBannerProps {
  promotion: Promotion;
}

export function PromotionBanner({ promotion }: PromotionBannerProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const handlePress = () => {
    if (promotion.link) {
      if (promotion.link.startsWith('/')) {
        router.push(promotion.link);
      } else if (promotion.link.startsWith('http')) {
        // Handle external links if needed
      }
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!promotion.link}
    >
      <Image
        source={{ uri: promotion.image_url || 'https://images.pexels.com/photos/6948655/pexels-photo-6948655.jpeg' }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={[styles.overlay, { backgroundColor: `${colors.primary}80` }]}>
        <View style={styles.content}>
          <Text style={styles.title}>{promotion.title}</Text>
          {promotion.description && (
            <Text style={styles.description} numberOfLines={2}>
              {promotion.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    width: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});