export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "sinpe";

export interface Payment {
  id: number;
  orderId: number;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  note: string;
  isCancelled: boolean;
  cancelledAt: string | null;
}

export interface PaymentCreate {
  orderId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  note?: string;
}

export interface OrderBalance {
  orderId: number;
  clientId: number;
  totalAmount: string;
  totalPaid: string;
  balance: string;
  fullyPaid: boolean;
}

export interface PaymentRegistered {
  payment: Payment;
  balance: OrderBalance;
}

export interface PaymentFilters {
  orderId?: number;
  clientId?: number;
}