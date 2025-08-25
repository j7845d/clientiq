
import type { Client } from '../types';
import { apiService } from './apiService';

export const getClients = async (userId: string): Promise<Client[]> => {
  return apiService.get<Client[]>(`/clients?userId=${userId}`);
};

export const addClient = async (userId: string, clientData: Pick<Client, 'name' | 'value' | 'status' | 'email' | 'phone'>): Promise<Client> => {
  return apiService.post<Client>('/clients', { ...clientData, userId });
};

export const getAllClientsData = async (): Promise<{ [userId: string]: Client[] }> => {
  return apiService.get<{ [userId: string]: Client[] }>('/clients/all');
};
