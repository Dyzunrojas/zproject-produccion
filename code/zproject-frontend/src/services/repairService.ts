import { api } from "../api/client";
import type { OrderStatus } from "../types/order";
import type {
  Repair,
  RepairCreate,
  RepairDiagnosis,
  RepairFinalize,
  RepairFinalizeResult,
  RepairUpdate,
} from "../types/repair";

export async function getRepairs(): Promise<Repair[]> {
  const { data } = await api.get<Repair[]>("/repairs");
  return data;
}

export async function createRepair(payload: RepairCreate): Promise<Repair> {
  const { data } = await api.post<Repair>("/repairs", payload);
  return data;
}

export async function updateRepair(
  id: number,
  payload: RepairUpdate,
): Promise<Repair> {
  const { data } = await api.put<Repair>(`/repairs/${id}`, payload);
  return data;
}

export async function registerDiagnosis(
  id: number,
  payload: RepairDiagnosis,
): Promise<Repair> {
  const { data } = await api.post<Repair>(`/repairs/${id}/diagnosis`, payload);
  return data;
}

export async function changeRepairStatus(
  id: number,
  status: OrderStatus,
): Promise<Repair> {
  const { data } = await api.patch<Repair>(`/repairs/${id}/status`, { status });
  return data;
}

export async function finalizeRepair(
  id: number,
  payload: RepairFinalize,
): Promise<RepairFinalizeResult> {
  const { data } = await api.post<RepairFinalizeResult>(
    `/repairs/${id}/finalize`,
    payload,
  );
  return data;
}