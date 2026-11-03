import { Modal, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { addObject } from "../../services/printOrderService";
import { validateObjectName } from "../../utils/validators";
import { FormActions } from "../molecules/FormActions";

interface ObjectFormProps {
  orderId: number;
  onSaved: () => void;
  onCancel: () => void;
}

function ObjectForm({ orderId, onSaved, onCancel }: ObjectFormProps) {
  const { busy, run } = useAsyncAction();
  const form = useForm({
    initialValues: { name: "", description: "" },
    validate: {
      name: validateObjectName,
    },
  });

  const handleSubmit = async (values: { name: string; description: string }) => {
    const ok = await run(
      () =>
        addObject(orderId, {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        }),
      "Objeto agregado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Nombre" {...form.getInputProps("name")} />
        <Textarea
          label="Descripción (opcional)"
          autosize
          minRows={3}
          {...form.getInputProps("description")}
        />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Agregar" />
      </Stack>
    </form>
  );
}

interface ObjectFormModalProps {
  opened: boolean;
  orderId: number;
  onClose: () => void;
  onSaved: () => void;
}

export function ObjectFormModal({ opened, orderId, onClose, onSaved }: ObjectFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Agregar objeto" centered>
      <ObjectForm orderId={orderId} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}