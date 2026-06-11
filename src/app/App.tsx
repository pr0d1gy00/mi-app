import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { DarkModeProvider } from '@/theme/DarkModeProvider';
import { NotificationProvider } from '@/app/NotificationProvider';
import { AuthInitializer } from '@/app/AuthInitializer';
import { RootNavigator } from '@/navigation/RootNavigator';
import { queryClient } from './providers';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DarkModeProvider>
          <SafeAreaProvider>
            <NotificationProvider>
              <AuthInitializer>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </AuthInitializer>
            </NotificationProvider>
          </SafeAreaProvider>
        </DarkModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
