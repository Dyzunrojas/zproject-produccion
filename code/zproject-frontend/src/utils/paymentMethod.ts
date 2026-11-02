import type { PaymentMethod } from "../types/payment";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  sinpe: "SINPE Móvil",
};

export const paymentMethodOptions = Object.entries(paymentMethodLabels).map(
  ([value, label]) => ({ value, label }),
);