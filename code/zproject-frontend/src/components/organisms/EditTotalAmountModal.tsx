import { Modal, NumberInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { updatePrintOrder } from "../../services/printOrderService";
import { formatMoney } from "../../utils/format";
import { FormActions } from "../molecules/FormActions";

interface EditTotalAmountFormProps {
  orderId: number;
  currentAmount: number | null;
  totalPaid: number;
  onSaved: () => void;
  onCancel: () => void;
}

function EditTotalAmountForm({
  orderId,
  currentAmount,
  totalPaid,
  onSaved,
  onCancel,
}: EditTotalAmountFormProps) {
  const { busy, run } = useAsyncAction();
  const form = useForm<{ totalAmount: number | string }>({
    initialValues: { totalAmount: currentAmount ?? "" },
    validate: {
      totalAmount: (value) => {
        if (value === "" || !(Number(value) >= 0)) return "Ingresa un monto válido";
        if (Number(value) < totalPaid) {
          return `No puede ser menor a lo ya abonado (${formatMoney(totalPaid)})`;
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: { totalAmount: number | string }) => {
    const ok = await run(
      () => updatePrintOrder(orderId, { totalAmount: Number(values.totalAmount) }),
      "Monto actualizado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {totalPaid > 0 && <Text size="sm">Ya abonado: {formatMoney(totalPaid)}</Text>}
        <NumberInput
          label="Monto total del pedido"
          prefix="₡ "
          thousandSeparator=" "
          decimalScale={2}
          min={0}
          {...form.getInputProps("totalAmount")}
        />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Guardar" />
      </Stack>
    </form>
  );
}

interface EditTotalAmountModalProps {
  opened: boolean;
  orderId: number;
  currentAmount: number | null;
  totalPaid: number;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTotalAmountModal({
  opened,
  orderId,
  currentAmount,
  totalPaid,
  onClose,
  onSaved,
}: EditTotalAmountModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Monto total del pedido" centered>
      <EditTotalAmountForm
        orderId={orderId}
        currentAmount={currentAmount}
        totalPaid={totalPaid}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  );
}
