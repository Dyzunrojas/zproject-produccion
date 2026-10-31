import { api } from "../api/client";
import type { Tool, ToolCreate, ToolUpdate } from "../types/tool";

export async function getTools(statusFilter?: string): Promise<Tool[]> {
  const { data } = await api.get<Tool[]>("/tools", {
    params: statusFilter ? { statusFilter } : undefined,
  });
  return data;
}

export async function createTool(payload: ToolCreate, force = false): Promise<Tool> {
  const { data } = await api.post<Tool>("/tools", payload, {
    params: force ? { force } : undefined,
  });
  return data;
}

export async function updateTool(id: number, payload: ToolUpdate): Promise<Tool> {
  const { data } = await api.put<Tool>(`/tools/${id}`, payload);
  return data;
}

export async function deleteTool(id: number): Promise<void> {
  await api.delete(`/tools/${id}`);
}