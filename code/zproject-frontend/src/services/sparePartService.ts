import { api } from "../api/client";
import type {
  SparePart,
  SparePartCreate,
  SparePartUpdate,
} from "../types/sparePart";

export async function getSpareParts(): Promise<SparePart[]> {
  const { data } = await api.get<SparePart[]>("/spare-parts");
  return data;
}

export async function createSparePart(
  payload: SparePartCreate,
): Promise<SparePart> {
  const { data } = await api.post<SparePart>("/spare-parts", payload);
  return data;
}

export async function updateSparePart(
  id: number,
  payload: SparePartUpdate,
): Promise<SparePart> {
  const { data } = await api.put<SparePart>(`/spare-parts/${id}`, payload);
  return data;
}

export async function deleteSparePart(id: number): Promise<void> {
  await api.delete(`/spare-parts/${id}`);
}
