export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  preferredCurrency: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserEntity;
}
