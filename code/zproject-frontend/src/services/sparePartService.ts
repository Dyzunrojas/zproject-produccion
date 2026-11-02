import { api } from "../api/client";
import type {
  SparePart,
  SparePartCreate,
  SparePartUpdate,
} from "../types/sparePart";

export async function getSpareParts(): Promise<SparePart[]> {
  const { data } = await api.get<SparePart[]>("/spareParts");
  return data;
}

export async function createSparePart(
  payload: SparePartCreate,
): Promise<SparePart> {
  const { data } = await api.post<SparePart>("/spareParts", payload);
  return data;
}

export async function updateSparePart(
  id: number,
  payload: SparePartUpdate,
): Promise<SparePart> {
  const { data } = await api.put<SparePart>(`/spareParts/${id}`, payload);
  return data;
}

export async function deleteSparePart(id: number): Promise<void> {
  await api.delete(`/spareParts/${id}`);
}