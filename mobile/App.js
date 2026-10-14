import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { Lora_500Medium, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { ThemeProvider, useTheme } from './src/theme/theme.js';
import { ToastProvider } from './src/components/ui.js';
import { useAuth } from './src/store/auth.js';
import { useStudio } from './src/store/studio.js';
import RootNavigator from './src/navigation/RootNavigator.js';

/*
 * App — gốc ứng dụng WoodHub (Android). Bố cục: Theme → Query → Toast → Navigation.
 * Cách ly dữ liệu theo tài khoản (giống web, services/accountScope.js): đổi/đăng xuất tài khoản thì xoá cache
 * React Query và reset trạng thái thiết kế của người trước.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

let prevUserId = null;
useAuth.subscribe((s) => {
  const id = s.user?.id ?? null;
  if (id !== prevUserId) {
    prevUserId = id;
    queryClient.clear();
    useStudio.getState().reset();
  }
});

function Shell() {
  const { c, isDark } = useTheme();
  const hydrate = useAuth((s) => s.hydrate);
  const ready = useAuth((s) => s.ready);
  useEffect(() => { hydrate(); }, [hydrate]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: { ...(isDark ? DarkTheme : DefaultTheme).colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.pri },
  };

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: c.hero, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#F8F4EC" /></View>;
  }
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [loaded] = useFonts({
    BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold,
    Lora_500Medium, Lora_600SemiBold, Lora_700Bold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#5B4232' }} />;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
