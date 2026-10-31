import { api } from "../api/client";
import type {
  RepairOption,
  Warranty,
  WarrantyCreate,
  WarrantyUpdate,
  WarrantyFilters,
} from "../types/warranty";

export async function getRepairs(): Promise<RepairOption[]> {
  const { data } = await api.get<RepairOption[]>("/repairs");
  return data;
}

export async function getWarranties(filters: WarrantyFilters = {}): Promise<Warranty[]> {
  const { data } = await api.get<Warranty[]>("/warranties", { params: filters });
  return data;
}

export async function createWarranty(payload: WarrantyCreate, force = false): Promise<Warranty> {
  const { data } = await api.post<Warranty>("/warranties", payload, {
    params: force ? { force } : undefined,
  });
  return data;
}

export async function updateWarranty(id: number, payload: WarrantyUpdate): Promise<Warranty> {
  const { data } = await api.put<Warranty>(`/warranties/${id}`, payload);
  return data;
}

export async function deleteWarranty(id: number): Promise<void> {
  await api.delete(`/warranties/${id}`);
}