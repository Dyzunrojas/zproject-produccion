import { Badge } from "@mantine/core";
import type { OrderStatus } from "../../types/order";
import { orderStatusColors, orderStatusLabels } from "../../utils/orderStatus";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge color={orderStatusColors[status]}>{orderStatusLabels[status]}</Badge>;
}