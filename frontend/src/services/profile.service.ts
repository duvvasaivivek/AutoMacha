import { api } from './index';
import type { User } from '@/types';

export interface UpdateProfilePayload {
  full_name?: string;
  branch?: string;
  academic_year?: string;
  hostel?: string;
  gender?: string;
  phone_number?: string;
  bio?: string;
  clear_picture?: boolean;
}

export async function getProfile(): Promise<User> {
  const response = await api.get<User>('/profile/');
  return response.data;
}

export async function updateProfile(data: FormData | UpdateProfilePayload): Promise<User> {
  const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const response = await api.patch<User>('/profile/', data, config);
  return response.data;
}

export const profileService = {
  getProfile,
  updateProfile,
};

export default profileService;

