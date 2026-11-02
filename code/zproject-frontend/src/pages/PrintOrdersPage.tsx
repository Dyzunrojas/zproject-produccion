import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Group, SegmentedControl, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { StatusBadge } from "../components/atoms/StatusBadge";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { PrintOrderFormModal } from "../components/organisms/PrintOrderFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { changePrintOrderStatus, getPrintOrders } from "../services/printOrderService";
import type { PrintOrder } from "../types/printOrder";
import { formatDate, formatMoney } from "../utils/format";
import { orderStatusLabels } from "../utils/orderStatus";

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: orderStatusLabels.pending, value: "pending" },
  { label: orderStatusLabels.inProgress, value: "inProgress" },
  { label: orderStatusLabels.finished, value: "finished" },
  { label: orderStatusLabels.cancelled, value: "cancelled" },
];

export function PrintOrdersPage() {
  const navigate = useNavigate();
  const { data: orders, loading, reload } = useLoad(getPrintOrders, [] as PrintOrder[]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpened, createHandlers] = useDisclosure(false);
  const cancelModal = useItemModal<PrintOrder>();
  const { busy, run } = useAsyncAction();

  const visibleOrders =
    statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter);

  const handleCreated = () => {
    createHandlers.close();
    reload();
  };

  const handleStart = async (order: PrintOrder) => {
    const ok = await run(
      () => changePrintOrderStatus(order.id, "inProgress"),
      `Pedido #${order.id} en proceso`,
    );
    if (ok) reload();
  };

  const handleCancel = async () => {
    const target = cancelModal.item;
    if (!target) return;
    const ok = await run(
      () => changePrintOrderStatus(target.id, "cancelled"),
      `Pedido #${target.id} cancelado`,
    );
    if (ok) {
      cancelModal.close();
      reload();
    }
  };

  const columns: Column<PrintOrder>[] = [
    { header: "#", render: (order) => order.id },
    { header: "Cliente", render: (order) => order.clientName },
    { header: "Objetos", render: (order) => order.objects.length },
    { header: "Estado", render: (order) => <StatusBadge status={order.status} /> },
    { header: "Entrega estimada", render: (order) => formatDate(order.estimatedDeliveryDate) },
    { header: "Entregado", render: (order) => formatDate(order.deliveryDate) },
    {
      header: "Saldo pendiente",
      render: (order) => {
        if (order.totalAmount === null) {
          return (
            <Text size="sm" c="dimmed">
              Sin monto
            </Text>
          );
        }
        return order.balance <= 0 ? (
          <Badge color="green">Pagado</Badge>
        ) : (
          <Text size="sm" fw={600}>
            {formatMoney(order.balance)}
          </Text>
        );
      },
    },
    {
      header: "Acciones",
      render: (order) => (
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant="default"
            onClick={() => navigate(`/printOrders/${order.id}`)}
          >
            Ver detalle
          </Button>
          <PermissionGate permission="print_orders:update">
            {order.status === "pending" && (
              <Button size="xs" variant="light" onClick={() => handleStart(order)}>
                Iniciar
              </Button>
            )}
            {(order.status === "pending" || order.status === "inProgress") && (
              <Button size="xs" variant="light" color="red" onClick={() => cancelModal.open(order)}>
                Cancelar
              </Button>
            )}
          </PermissionGate>
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Pedidos 3D"
        actions={
          <PermissionGate permission="print_orders:create">
            <Button onClick={createHandlers.open}>Nuevo pedido</Button>
          </PermissionGate>
        }
      />

      <SegmentedControl
        mb="md"
        value={statusFilter}
        onChange={(value) => setStatusFilter(String(value))}
        data={filterOptions}
      />

      <DataTable
        rows={visibleOrders}
        columns={columns}
        getRowKey={(order) => order.id}
        loading={loading}
        emptyMessage="No hay pedidos para mostrar."
        minWidth={900}
      />

      <PrintOrderFormModal
        opened={createOpened}
        onClose={createHandlers.close}
        onSaved={handleCreated}
      />

      <ConfirmModal
        opened={cancelModal.opened}
        title="Cancelar pedido"
        message={
          cancelModal.item
            ? `¿Cancelar el pedido #${cancelModal.item.id} de ${cancelModal.item.clientName}? No se podrá modificar después.`
            : ""
        }
        confirmLabel="Cancelar pedido"
        loading={busy}
        onConfirm={handleCancel}
        onCancel={cancelModal.close}
      />
    </>
  );
}