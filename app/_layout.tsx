import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PoopProvider } from '../context/PoopContext';
import { C } from '../constants/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PressStart2P: PressStart2P_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PoopProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            animation: 'slide_from_bottom',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="history" />
          <Stack.Screen
            name="edit/[id]"
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
        </Stack>
      </PoopProvider>
    </SafeAreaProvider>
  );
}
