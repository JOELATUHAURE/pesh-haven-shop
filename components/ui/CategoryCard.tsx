import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Category } from '@/types/supabase';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  // Placeholder images for different categories
  const placeholderImages: Record<string, string> = {
    'Baking Ingredients': 'https://images.pexels.com/photos/7474207/pexels-photo-7474207.jpeg',
    'Cake Supplies': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
    'Spices': 'https://images.pexels.com/photos/6107583/pexels-photo-6107583.jpeg',
    'Rice': 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg',
    'Disposable Items': 'https://images.pexels.com/photos/5049856/pexels-photo-5049856.jpeg',
    'default': 'https://images.pexels.com/photos/4202326/pexels-photo-4202326.jpeg'
  };
  
  const imageUrl = category.image_url || 
    placeholderImages[category.name] || 
    placeholderImages.default;
  
  const handlePress = () => {
    router.push(`/category/${category.id}`);
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
      />
      <Text style={[styles.name, { color: colors.text }]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 3; // 3 cards per row with margins

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth + 30, // Extra space for text
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
    alignItems: 'center',
  },
  image: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 12,
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});