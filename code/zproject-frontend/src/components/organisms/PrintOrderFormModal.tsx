import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useLoad } from "../../hooks/useLoad";
import { getClients } from "../../services/clientService";
import { createPrintOrder } from "../../services/printOrderService";
import type { Client } from "../../types/client";
import { validateObjectName } from "../../utils/validators";
import { FormActions } from "../molecules/FormActions";

interface PrintOrderFormValues {
  clientId: string | null;
  estimatedDeliveryDate: string;
  totalAmount: number | string;
  objects: { key: string; name: string; description: string }[];
}

const todayString = () => new Date().toLocaleDateString("en-CA");
const emptyObject = () => ({ key: randomId(), name: "", description: "" });

interface PrintOrderFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

function PrintOrderForm({ onSaved, onCancel }: PrintOrderFormProps) {
  const { busy, run } = useAsyncAction();
  const { data: clients, loading } = useLoad(getClients, [] as Client[]);
  const minDate = todayString();

  const form = useForm<PrintOrderFormValues>({
    initialValues: {
      clientId: null,
      estimatedDeliveryDate: "",
      totalAmount: "",
      objects: [emptyObject()],
    },
    validate: {
      clientId: (value) => (value ? null : "Selecciona un cliente"),
      estimatedDeliveryDate: (value) => {
        if (!value) return "Selecciona la fecha de entrega";
        if (value < minDate) return "La fecha no puede ser anterior a hoy";
        return null;
      },
      totalAmount: (value) =>
        value !== "" && !(Number(value) >= 0) ? "Ingresa un monto válido" : null,
      objects: {
        name: validateObjectName,
      },
    },
  });

  const clientOptions = clients
    .filter((client) => client.isActive)
    .map((client) => ({ value: String(client.id), label: client.name }));

  const handleSubmit = async (values: PrintOrderFormValues) => {
    const ok = await run(
      () =>
        createPrintOrder({
          clientId: Number(values.clientId),
          estimatedDeliveryDate: values.estimatedDeliveryDate,
          totalAmount: values.totalAmount === "" ? undefined : Number(values.totalAmount),
          objects: values.objects.map((item) => ({
            name: item.name.trim(),
            description: item.description.trim() || undefined,
          })),
        }),
      "Pedido creado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Select
          label="Cliente"
          placeholder={loading ? "Cargando clientes..." : "Selecciona un cliente"}
          data={clientOptions}
          searchable
          nothingFoundMessage="No se encontraron clientes"
          disabled={loading}
          {...form.getInputProps("clientId")}
        />
        <TextInput
          label="Fecha de entrega estimada"
          type="date"
          min={minDate}
          {...form.getInputProps("estimatedDeliveryDate")}
        />
        <NumberInput
          label="Monto total (opcional, se puede definir después)"
          prefix="₡ "
          thousandSeparator=" "
          decimalScale={2}
          min={0}
          {...form.getInputProps("totalAmount")}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Objetos del pedido
          </Text>
          {form.values.objects.map((item, index) => (
            <Stack key={item.key} gap={4}>
              <Group align="flex-start" wrap="nowrap">
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Nombre del objeto"
                  {...form.getInputProps(`objects.${index}.name`)}
                />
                <Button
                  variant="subtle"
                  color="red"
                  disabled={form.values.objects.length === 1}
                  onClick={() => form.removeListItem("objects", index)}
                >
                  Quitar
                </Button>
              </Group>
              <Textarea
                placeholder="Descripción (opcional): medidas, detalles, si hay que diseñarlo..."
                autosize
                minRows={2}
                {...form.getInputProps(`objects.${index}.description`)}
              />
            </Stack>
          ))}
          <Button variant="light" onClick={() => form.insertListItem("objects", emptyObject())}>
            Agregar objeto
          </Button>
        </Stack>

        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Crear pedido" />
      </Stack>
    </form>
  );
}

interface PrintOrderFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PrintOrderFormModal({ opened, onClose, onSaved }: PrintOrderFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo pedido de impresión 3D" centered>
      <PrintOrderForm onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}