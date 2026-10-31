export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface ClientCreate {
  name: string;
  phone?: string;
  email?: string;
}

export type ClientUpdate = Partial<ClientCreate>;