import type { OrderStatus } from "../types/order";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  inProgress: "En proceso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const orderStatusColors: Record<OrderStatus, string> = {
  pending: "gray",
  inProgress: "blue",
  finished: "green",
  cancelled: "red",
};