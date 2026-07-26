import { api } from './index';
import type { User } from '@/types';
import { getAccessToken } from '@/lib/auth';

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RegisterData {
  username: string;
  institute_email: string;
  roll_number: string;
  branch?: string;
  hostel?: string;
  gender?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/accounts/token/', credentials);
  return response.data;
}

export async function fetchProfile(token?: string): Promise<User> {
  const accessToken = token || getAccessToken();
  const response = await api.get<User>('/accounts/me/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function register(data: RegisterData): Promise<User> {
  const response = await api.post<User>('/accounts/register/', data);
  return response.data;
}

export const authService = {
  login,
  fetchProfile,
  register,
};

export default authService;
