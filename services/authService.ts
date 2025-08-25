
import type { User } from '../types';
import { apiService } from './apiService';

const CURRENT_USER_KEY = 'sales_power_suite_current_user';

export const register = async (name: string, email: string, password: string): Promise<User> => {
  const newUser = await apiService.post<User>('/auth/register', { name, email, password });
  
  return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
  const user = await apiService.post<User>('/auth/login', { email, password });
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = (): void => {
  sessionStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const user = sessionStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Failed to parse current user from sessionStorage", error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  return apiService.get<User[]>('/users');
};
