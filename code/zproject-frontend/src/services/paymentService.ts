import { api } from "../api/client";
import type {
  OrderBalance,
  Payment,
  PaymentCreate,
  PaymentFilters,
  PaymentRegistered,
} from "../types/payment";

export async function getPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/payments", { params: filters });
  return data;
}

export async function getOrderBalance(orderId: number): Promise<OrderBalance> {
  const { data } = await api.get<OrderBalance>(`/payments/orders/${orderId}/balance`);
  return data;
}

export async function registerPayment(payload: PaymentCreate): Promise<PaymentRegistered> {
  const { data } = await api.post<PaymentRegistered>("/payments", payload);
  return data;
}

export async function cancelPayment(id: number): Promise<PaymentRegistered> {
  const { data } = await api.post<PaymentRegistered>(`/payments/${id}/cancel`);
  return data;
}