import { Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { updatePrintOrder } from "../../services/printOrderService";
import { FormActions } from "../molecules/FormActions";

const todayString = () => new Date().toLocaleDateString("en-CA");

interface EditDeliveryDateFormProps {
  orderId: number;
  currentDate: string;
  onSaved: () => void;
  onCancel: () => void;
}

function EditDeliveryDateForm({ orderId, currentDate, onSaved, onCancel }: EditDeliveryDateFormProps) {
  const { busy, run } = useAsyncAction();
  const minDate = todayString();
  const form = useForm({
    initialValues: { estimatedDeliveryDate: currentDate.slice(0, 10) },
    validate: {
      estimatedDeliveryDate: (value) => {
        if (!value) return "Selecciona la fecha";
        if (value < minDate) return "La fecha no puede ser anterior a hoy";
        return null;
      },
    },
  });

  const handleSubmit = async (values: { estimatedDeliveryDate: string }) => {
    const ok = await run(
      () => updatePrintOrder(orderId, { estimatedDeliveryDate: values.estimatedDeliveryDate }),
      "Fecha actualizada",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Fecha de entrega estimada"
          type="date"
          min={minDate}
          {...form.getInputProps("estimatedDeliveryDate")}
        />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Guardar" />
      </Stack>
    </form>
  );
}

interface EditDeliveryDateModalProps {
  opened: boolean;
  orderId: number;
  currentDate: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditDeliveryDateModal({
  opened,
  orderId,
  currentDate,
  onClose,
  onSaved,
}: EditDeliveryDateModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Cambiar fecha de entrega" centered>
      <EditDeliveryDateForm
        orderId={orderId}
        currentDate={currentDate}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  );
}