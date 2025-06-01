import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Import CSS for web platform
if (Platform.OS === 'web') {
  // Import global styles for web
  require('../global.css');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="adoption-detail" options={{ headerShown: false }} />
        <Stack.Screen name="lost-detail" options={{ headerShown: false }} />
        <Stack.Screen name="question-detail" options={{ headerShown: false }} />
        <Stack.Screen name="pet-profile" options={{ headerShown: false }} />
        <Stack.Screen name="donate" options={{ headerShown: false }} />
        <Stack.Screen name="treatments" options={{ headerShown: false }} />
        <Stack.Screen name="vaccinations" options={{ headerShown: false }} />
        <Stack.Screen name="appointments" options={{ headerShown: false }} />
        <Stack.Screen name="medications" options={{ headerShown: false }} />
        <Stack.Screen name="allergies" options={{ headerShown: false }} />
        <Stack.Screen name="weight-records" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
