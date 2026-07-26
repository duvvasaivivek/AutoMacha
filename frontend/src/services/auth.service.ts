import { api } from './index';

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/accounts/token/', credentials);
  return response.data;
}

export const authService = {
  login,
};

export default authService;
