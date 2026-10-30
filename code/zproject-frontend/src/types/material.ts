export interface Material {
  id: number;
  type: string;
  color: string;
  diameter: number;
  stockGrams: number;
  isActive: boolean;
}

export interface MaterialCreate {
  type: string;
  color: string;
  diameter: number;
  stockGrams: number;
}

export type MaterialUpdate = Partial<MaterialCreate>;

export interface MaterialPurchase {
  grams: number;
}