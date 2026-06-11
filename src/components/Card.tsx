import React, { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { CardProps } from './types';

function getShadowStyle(
  shadow: { y: number; blur: number; opacity: number; color?: string } | null,
) {
  if (!shadow) {
    return {
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
      shadowOpacity: 0,
      shadowColor: '#000',
      elevation: 0,
    };
  }
  return {
    shadowOffset: { width: 0, height: shadow.y },
    shadowRadius: shadow.blur,
    shadowOpacity: shadow.opacity,
    shadowColor: shadow.color ?? '#000',
    elevation: shadow.y * 2,
  };
}

export function Card({
  children,
  variant = 'default',
  pressable,
  onPress,
  style,
  testID,
}: CardProps) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const shadow =
    variant === 'elevated' ? theme.shadows.lg : variant === 'flat' ? null : theme.shadows.md;

  const shadowStyle = getShadowStyle(shadow);

  const cardStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    ...shadowStyle,
    ...(variant === 'flat' ? { borderWidth: 1, borderColor: theme.colors.border } : {}),
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  if (pressable) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
      >
        <Animated.View style={[cardStyle, animatedStyle, style]}>{children}</Animated.View>
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={{ ...cardStyle, ...style }}>
      {children}
    </View>
  );
}
