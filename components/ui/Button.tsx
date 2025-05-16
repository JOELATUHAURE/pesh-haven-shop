import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'solid',
  size = 'medium',
  color = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // Determine the button style based on variant and color
  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = {};
    
    // Base styles for all variants
    switch (variant) {
      case 'solid':
        buttonStyle = {
          backgroundColor: colors[color],
          borderWidth: 0,
        };
        break;
      case 'outline':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors[color],
        };
        break;
      case 'ghost':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
        break;
    }
    
    // Apply disabled styles
    if (disabled) {
      buttonStyle.opacity = 0.5;
    }
    
    // Apply size styles
    switch (size) {
      case 'small':
        buttonStyle.paddingVertical = 6;
        buttonStyle.paddingHorizontal = 12;
        buttonStyle.borderRadius = 4;
        break;
      case 'medium':
        buttonStyle.paddingVertical = 10;
        buttonStyle.paddingHorizontal = 16;
        buttonStyle.borderRadius = 6;
        break;
      case 'large':
        buttonStyle.paddingVertical = 14;
        buttonStyle.paddingHorizontal = 24;
        buttonStyle.borderRadius = 8;
        break;
    }
    
    // Apply full width
    if (fullWidth) {
      buttonStyle.width = '100%';
    }
    
    return buttonStyle;
  };
  
  // Determine the text style based on variant and color
  const getTextStyle = () => {
    let textStyle: TextStyle = {};
    
    // Base text styles
    switch (variant) {
      case 'solid':
        textStyle.color = '#FFFFFF';
        break;
      case 'outline':
      case 'ghost':
        textStyle.color = colors[color];
        break;
    }
    
    // Apply size styles
    switch (size) {
      case 'small':
        textStyle.fontSize = 12;
        break;
      case 'medium':
        textStyle.fontSize = 14;
        break;
      case 'large':
        textStyle.fontSize = 16;
        break;
    }
    
    return textStyle;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'solid' ? '#FFFFFF' : colors[color]} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
});