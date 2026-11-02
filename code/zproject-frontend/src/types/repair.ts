import type { SparePart } from "./sparePart";

export interface Device {
  id: number;
  clientId: number;
  type: string;
  brand: string;
  model: string;
  serialNumber: string | null;
}

export interface DeviceData {
  type: string;
  brand: string;
  model: string;
  serialNumber: string | null;
}

export interface SparePartUsage {
  id: number;
  sparePartId: number;
  quantityUsed: number;
  sparePart: SparePart;
}

export interface Repair {
  id: number;
  clientId: number;
  status: string;
  createdAt: string;
  estimatedDeliveryDate: string;
  deliveryDate: string | null;
  finishedAt: string | null;
  problemDescription: string;
  diagnosis: string | null;
  workDescription: string | null;
  diagnosisAmount: number | null;
  workAmount: number | null;
  device: Device;
  spareParts: SparePartUsage[];
}

export interface RepairCreate {
  clientId: number;
  device: DeviceData;
  problemDescription: string;
  estimatedDeliveryDate: string;
  allowDuplicate: boolean;
}

export interface RepairUpdate {
  problemDescription?: string;
  workDescription?: string;
  workAmount?: number;
  estimatedDeliveryDate?: string;
  device?: Partial<DeviceData>;
}

export interface RepairDiagnosis {
  diagnosis: string;
  diagnosisAmount: number;
}

export interface RepairStatusChange {
  status: string;
}

export interface RepairSparePartLine {
  sparePartId: number;
  quantityUsed: number;
}

export interface RepairFinalize {
  spareParts: RepairSparePartLine[];
}

export interface RepairFinalizeResult {
  repair: Repair;
  warning: string | null;
}



