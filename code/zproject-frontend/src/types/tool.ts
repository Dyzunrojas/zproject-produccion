export type ToolStatus = "disponible" | "en_uso" | "mantenimiento" | "baja";

export interface Tool {
  id: number;
  name: string;
  description: string;
  quantity: number;
  status: ToolStatus;
  isActive: boolean;
}

export interface ToolCreate {
  name: string;
  description?: string;
  quantity: number;
  status: ToolStatus;
}

export type ToolUpdate = Partial<ToolCreate>;
