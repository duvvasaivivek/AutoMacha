import { api } from './index';
import type { User } from '@/types';

export interface UpdateProfilePayload {
  branch?: string;
  hostel?: string;
  gender?: string;
  phone_number?: string;
}

export async function getProfile(): Promise<User> {
  const response = await api.get<User>('/accounts/profile/');
  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await api.patch<User>('/accounts/profile/', payload);
  return response.data;
}

export const profileService = {
  getProfile,
  updateProfile,
};

export default profileService;
