import type { OrderStatus } from "./order";

export interface Object3D {
  id: number;
  name: string;
  description: string | null;
  stlFilePath: string | null;
}

export interface Object3DCreate {
  name: string;
  description?: string;
}

export interface MaterialUsage {
  id: number;
  materialId: number;
  gramsUsed: number;
}

export interface PrintOrder {
  id: number;
  clientId: number;
  clientName: string;
  status: OrderStatus;
  estimatedDeliveryDate: string;
  deliveryDate: string | null;
  totalAmount: number | null;
  totalPaid: number;
  balance: number;
  objects: Object3D[];
  materialUsages: MaterialUsage[];
}

export interface PrintOrderCreate {
  clientId: number;
  estimatedDeliveryDate: string;
  totalAmount?: number;
  objects: Object3DCreate[];
}

export interface PrintOrderUpdate {
  estimatedDeliveryDate?: string;
  totalAmount?: number;
}

export interface PrintOrderFinalize {
  deliveryDate?: string;
  materialsUsed: { materialId: number; gramsUsed: number }[];
}

export interface PrintOrderFinalizeResponse {
  printOrder: PrintOrder;
  warning: string | null;
}