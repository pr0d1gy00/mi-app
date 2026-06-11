import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = '@mi-purchase:auth-token';
const USER_KEY = '@mi-purchase:auth-user';

export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(`@mi-purchase:${key}`, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(`@mi-purchase:${key}`);
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(`@mi-purchase:${key}`);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: string): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, user);
}

export async function getUser(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_KEY);
}

export async function deleteUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}
