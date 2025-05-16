const tintColorLight = '#FF9E43';
const tintColorDark = '#FFB067';

export default {
  light: {
    text: '#333333',
    background: '#F8F8F8',
    tint: tintColorLight,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorLight,
    primary: '#FF9E43', // Orange
    primaryDark: '#E88A2E', // Darker orange
    secondary: '#FFC777', // Light orange/yellow
    accent: '#4A6572', // Slate blue/gray
    success: '#4CAF50', // Green
    warning: '#FFC107', // Amber
    error: '#F44336', // Red
    info: '#2196F3', // Blue
    cream: '#FFF6E9', // Light cream
    softYellow: '#FFF3CD', // Soft yellow
    white: '#FFFFFF',
    gray: '#9E9E9E',
    lightGray: '#E0E0E0',
    divider: '#EEEEEE',
    card: '#FFFFFF',
    cardBorder: '#EEEEEE',
    toast: {
      info: '#E3F2FD',
      success: '#E8F5E9',
      error: '#FFEBEE',
      warning: '#FFF8E1',
    }
  },
  dark: {
    text: '#F5F5F5',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    primary: '#FFB067', // Lighter orange for dark mode
    primaryDark: '#E88A2E', // Orange
    secondary: '#FFC777', // Light orange/yellow
    accent: '#78909C', // Lighter slate blue/gray
    success: '#81C784', // Lighter green
    warning: '#FFD54F', // Lighter amber
    error: '#E57373', // Lighter red
    info: '#64B5F6', // Lighter blue
    cream: '#524A3A', // Dark cream
    softYellow: '#524B38', // Dark soft yellow
    white: '#212121', // Dark gray instead of white
    gray: '#BDBDBD', // Lighter gray
    lightGray: '#424242', // Dark gray
    divider: '#333333',
    card: '#1E1E1E',
    cardBorder: '#333333',
    toast: {
      info: '#0D47A1',
      success: '#1B5E20',
      error: '#B71C1C',
      warning: '#F57F17',
    }
  },
};