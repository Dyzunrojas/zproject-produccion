import { api } from "../api/client";
import type {
  Material,
  MaterialCreate,
  MaterialPurchase,
  MaterialUpdate,
} from "../types/material";

export async function getMaterials(): Promise<Material[]> {
  const { data } = await api.get<Material[]>("/materials");
  return data;
}

export async function createMaterial(payload: MaterialCreate): Promise<Material> {
  const { data } = await api.post<Material>("/materials", payload);
  return data;
}

export async function updateMaterial(id: number, payload: MaterialUpdate): Promise<Material> {
  const { data } = await api.put<Material>(`/materials/${id}`, payload);
  return data;
}

export async function deleteMaterial(id: number): Promise<void> {
  await api.delete(`/materials/${id}`);
}

export async function purchaseMaterial(id: number, payload: MaterialPurchase): Promise<Material> {
  const { data } = await api.post<Material>(`/materials/${id}/purchase`, payload);
  return data;
}