export interface SparePart {
  id: number;
  name: string;
  brand: string;
  isOriginal: boolean;
  partNumber: string;
  stockUnits: number;
  isActive: boolean;
}

export interface SparePartCreate {
  name: string;
  brand: string;
  isOriginal: boolean;
  partNumber: string;
  stockUnits: number;
}

export type SparePartUpdate = Partial<SparePartCreate>;
