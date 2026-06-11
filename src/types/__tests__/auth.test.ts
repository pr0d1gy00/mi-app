/// <reference types="jest" />
import type { LoginInput, RegisterInput, AuthResponse, UserEntity } from '../auth';

describe('LoginInput', () => {
  it('should have email and password fields', () => {
    const input: LoginInput = {
      email: 'test@example.com',
      password: 'secret123',
    };

    expect(input.email).toBe('test@example.com');
    expect(input.password).toBe('secret123');
  });
});

describe('RegisterInput', () => {
  it('should have email, password, and name fields', () => {
    const input: RegisterInput = {
      email: 'new@example.com',
      password: 'securePass123',
      name: 'John Doe',
    };

    expect(input.email).toBe('new@example.com');
    expect(input.password).toBe('securePass123');
    expect(input.name).toBe('John Doe');
  });
});

describe('UserEntity', () => {
  it('should have all required fields', () => {
    const user: UserEntity = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Jane Doe',
      preferredCurrency: 'USD',
    };

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('user@example.com');
    expect(user.name).toBe('Jane Doe');
    expect(user.preferredCurrency).toBe('USD');
  });
});

describe('AuthResponse', () => {
  it('should have accessToken and user fields', () => {
    const response: AuthResponse = {
      accessToken: 'jwt-token-123',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Jane Doe',
        preferredCurrency: 'USD',
      },
    };

    expect(response.accessToken).toBe('jwt-token-123');
    expect(response.user.id).toBe('user-1');
    expect(response.user.name).toBe('Jane Doe');
  });
});
