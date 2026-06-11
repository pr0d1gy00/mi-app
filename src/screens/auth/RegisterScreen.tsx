import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { registerSchema } from '@/types/validation';

export function RegisterScreen() {
  const navigation = useNavigation();
  const { register, isLoading } = useAuthStore();
  const { notify } = useNotificationStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setErrors({});
    const result = registerSchema.safeParse({ name, email, password });
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
      await register(email, password, name);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setErrors({ form: message });
      notify({ type: 'error', title: 'Registration Error', message });
    }
  };

  return (
    <Screen scrollable>
      <Typography variant="h1">Create Account</Typography>
      <View style={{ gap: 16, marginTop: 24 }}>
        <Input
          testID="name-input"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          error={errors.name}
        />
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
        <Button testID="register-button" loading={isLoading} onPress={handleSubmit}>
          Register
        </Button>
        <Button variant="ghost" onPress={() => navigation.navigate('Login' as never)}>
          Already have an account? Login
        </Button>
      </View>
    </Screen>
  );
}
