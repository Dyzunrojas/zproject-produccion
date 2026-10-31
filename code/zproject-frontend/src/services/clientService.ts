import { api } from "../api/client";
import type { Client, ClientCreate, ClientUpdate } from "../types/client";

export async function getClients(search?: string): Promise<Client[]> {
  const { data } = await api.get<Client[]>("/clients", {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function getClient(id: number): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(payload: ClientCreate): Promise<Client> {
  const { data } = await api.post<Client>("/clients", payload);
  return data;
}

export async function updateClient(id: number, payload: ClientUpdate): Promise<Client> {
  const { data } = await api.put<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}