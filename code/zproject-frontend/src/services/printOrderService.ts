import { api } from "../api/client";
import type { OrderStatus } from "../types/order";
import type {
  Object3D,
  Object3DCreate,
  PrintOrder,
  PrintOrderCreate,
  PrintOrderFinalize,
  PrintOrderFinalizeResponse,
  PrintOrderUpdate,
} from "../types/printOrder";

export async function getPrintOrders(): Promise<PrintOrder[]> {
  const { data } = await api.get<PrintOrder[]>("/printOrders");
  return data;
}

export async function getPrintOrder(id: number): Promise<PrintOrder> {
  const { data } = await api.get<PrintOrder>(`/printOrders/${id}`);
  return data;
}

export async function createPrintOrder(payload: PrintOrderCreate): Promise<PrintOrder> {
  const { data } = await api.post<PrintOrder>("/printOrders", payload);
  return data;
}

export async function updatePrintOrder(id: number, payload: PrintOrderUpdate): Promise<PrintOrder> {
  const { data } = await api.put<PrintOrder>(`/printOrders/${id}`, payload);
  return data;
}

export async function changePrintOrderStatus(id: number, status: OrderStatus): Promise<PrintOrder> {
  const { data } = await api.patch<PrintOrder>(`/printOrders/${id}/status`, { status });
  return data;
}

export async function finalizePrintOrder(
  id: number,
  payload: PrintOrderFinalize,
): Promise<PrintOrderFinalizeResponse> {
  const { data } = await api.post<PrintOrderFinalizeResponse>(
    `/printOrders/${id}/finalize`,
    payload,
  );
  return data;
}

export async function addObject(id: number, payload: Object3DCreate): Promise<Object3D> {
  const { data } = await api.post<Object3D>(`/printOrders/${id}/objects`, payload);
  return data;
}

export async function deleteObject(id: number, objectId: number): Promise<void> {
  await api.delete(`/printOrders/${id}/objects/${objectId}`);
}

export async function uploadStl(id: number, objectId: number, file: File): Promise<Object3D> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Object3D>(`/printOrders/${id}/objects/${objectId}/stl`, formData);
  return data;
}

export async function downloadStl(id: number, objectId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/printOrders/${id}/objects/${objectId}/stl`, {
    responseType: "blob",
  });
  return data;
}