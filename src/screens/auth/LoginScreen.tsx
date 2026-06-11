import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { loginSchema } from '@/types/validation';

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading } = useAuthStore();
  const { notify } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setErrors({});
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setErrors({ form: message });
      notify({ type: 'error', title: 'Login Error', message });
    }
  };

  return (
    <Screen scrollable>
      <Typography variant="h1">Sign In</Typography>
      <View style={{ gap: 16, marginTop: 24 }}>
        <Input
          testID="email-input"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          error={errors.email}
        />
        <Input
          testID="password-input"
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
        />
        {errors.form && (
          <Typography variant="bodySmall" color="#DC2626">
            {errors.form}
          </Typography>
        )}
        <Button testID="login-button" loading={isLoading} onPress={handleSubmit}>
          Login
        </Button>
        <Button variant="ghost" onPress={() => navigation.navigate('Register' as never)}>
          Don't have an account? Register
        </Button>
      </View>
    </Screen>
  );
}
