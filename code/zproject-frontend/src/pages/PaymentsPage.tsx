import { Badge, Button, Group, NumberInput } from "@mantine/core";
import { useCallback, useState } from "react";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { PaymentFormModal } from "../components/organisms/PaymentFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { cancelPayment, getPayments } from "../services/paymentService";
import type { Payment } from "../types/payment";
import { formatDate, formatMoney } from "../utils/format";
import { paymentMethodLabels } from "../utils/paymentMethod";

const columns: Column<Payment>[] = [
  { header: "N.º", render: (payment) => payment.id },
  { header: "Pedido", render: (payment) => `#${payment.orderId}` },
  { header: "Monto", render: (payment) => formatMoney(Number(payment.amountPaid)) },
  {
    header: "Método",
    render: (payment) => paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod,
  },
  { header: "Fecha", render: (payment) => formatDate(payment.paymentDate) },
  { header: "Nota", render: (payment) => payment.note || "—" },
  {
    header: "Estado",
    render: (payment) =>
      payment.isCancelled ? (
        <Badge color="red">Cancelado</Badge>
      ) : (
        <Badge color="green">Vigente</Badge>
      ),
  },
];

function toFilter(value: number | string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function PaymentsPage() {
  const [orderId, setOrderId] = useState<number | string>("");
  const [clientId, setClientId] = useState<number | string>("");

  const fetcher = useCallback(
    () => getPayments({ orderId: toFilter(orderId), clientId: toFilter(clientId) }),
    [orderId, clientId],
  );
  const { data: payments, loading, reload } = useLoad(fetcher, [] as Payment[]);

  const formModal = useItemModal<Payment>();
  const cancelModal = useItemModal<Payment>();
  const { busy: cancelBusy, run } = useAsyncAction();

  const hasFilters = orderId !== "" || clientId !== "";

  const handleSaved = () => {
    formModal.close();
    reload();
  };

  const handleCancel = async () => {
    const target = cancelModal.item;
    if (!target) return;
    const ok = await run(() => cancelPayment(target.id), "Pago cancelado");
    if (ok) {
      cancelModal.close();
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Pagos"
        actions={
          <PermissionGate permission="payments:create">
            <Button onClick={() => formModal.open()}>Registrar abono</Button>
          </PermissionGate>
        }
      />

      <Group mb="md" align="flex-end" gap="sm">
        <NumberInput
          label="Pedido"
          placeholder="N.º de pedido"
          min={1}
          allowDecimal={false}
          w={180}
          value={orderId}
          onChange={(value) => setOrderId(typeof value === "bigint" ? Number(value) : value)}
        />
        <NumberInput
          label="Cliente"
          placeholder="N.º de cliente"
          min={1}
          allowDecimal={false}
          w={180}
          value={clientId}
          onChange={(value) => setClientId(typeof value === "bigint" ? Number(value) : value)}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            onClick={() => {
              setOrderId("");
              setClientId("");
            }}
          >
            Limpiar
          </Button>
        )}
      </Group>

      <DataTable
        rows={payments}
        columns={columns}
        getRowKey={(payment) => payment.id}
        loading={loading}
        minWidth={700}
        emptyMessage={
          hasFilters ? "Ningún pago cumple el criterio." : "No hay pagos registrados."
        }
        renderActions={(payment) =>
          payment.isCancelled ? null : (
            <PermissionGate permission="payments:update">
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => cancelModal.open(payment)}
              >
                Cancelar pago
              </Button>
            </PermissionGate>
          )
        }
      />

      <PaymentFormModal
        opened={formModal.opened}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={cancelModal.opened}
        title="Cancelar pago"
        message={
          cancelModal.item
            ? `¿Cancelar el pago #${cancelModal.item.id} por ${formatMoney(Number(cancelModal.item.amountPaid))}? El monto volverá al saldo pendiente del pedido.`
            : ""
        }
        confirmLabel="Cancelar pago"
        loading={cancelBusy}
        onConfirm={handleCancel}
        onCancel={cancelModal.close}
      />
    </>
  );
}