import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import type { ScreenProps } from './types';

export function Screen({ children, noPadding, backgroundColor, scrollable, testID }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor ?? theme.colors.background,
      padding: noPadding ? 0 : theme.spacing.lg,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
  });

  if (scrollable) {
    return (
      <SafeAreaView testID={testID} style={styles.container}>
        <ScrollView>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID={testID} style={styles.container}>
      {children}
    </SafeAreaView>
  );
}
