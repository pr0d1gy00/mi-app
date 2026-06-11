import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import type { NotificationItem } from '@/types/notification';

interface ToastProps {
  notification: NotificationItem;
  onDismiss: () => void;
  isVisible: boolean;
}

export function Toast({ notification, onDismiss, isVisible }: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isVisible) {
      slideAnim.setValue(-100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, notification.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [isVisible, notification.duration, onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy < -20) {
          onDismiss();
        }
      },
    }),
  ).current;

  if (!isVisible) return null;

  const colorMap = {
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
  };

  const backgroundColor = colorMap[notification.type];

  return (
    <Animated.View
      testID="toast"
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }],
        paddingHorizontal: theme.spacing.lg,
      }}
      {...panResponder.panHandlers}
    >
      <View
        style={{
          backgroundColor,
          borderRadius: theme.borderRadius.medium,
          padding: theme.spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.body.fontSize,
            fontWeight: '700',
            color: theme.colors.textPrimary,
          }}
        >
          {notification.title}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.bodySmall.fontSize,
            color: theme.colors.textPrimary,
            marginTop: theme.spacing.xs,
          }}
        >
          {notification.message}
        </Text>
      </View>
    </Animated.View>
  );
}
