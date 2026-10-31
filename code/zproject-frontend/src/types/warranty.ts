export interface Warranty {
  id: number;
  repairOrderId: number;
  startDate: string;
  expirationDate: string;
  conditions: string;
  isActive: boolean;
}

export interface WarrantyCreate {
  repairOrderId: number;
  startDate: string;
  expirationDate: string;
  conditions: string;
}

export type WarrantyUpdate = Partial<WarrantyCreate>;

export interface WarrantyFilters {
  repairOrderId?: number;
  fromDate?: string;
  toDate?: string;
}
