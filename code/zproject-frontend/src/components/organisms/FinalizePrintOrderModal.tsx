import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { PermissionGate } from "../atoms/PermissionGate";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useLoad } from "../../hooks/useLoad";
import { getMaterials } from "../../services/materialService";
import { finalizePrintOrder } from "../../services/printOrderService";
import type { Material } from "../../types/material";
import { formatGrams } from "../../utils/format";
import { notifyWarning } from "../../utils/notify";
import { FormActions } from "../molecules/FormActions";
import { InlineMaterialPurchase } from "./InlineMaterialPurchase";

interface FinalizeValues {
  deliveryDate: string;
  materialsUsed: { key: string; materialId: string | null; gramsUsed: number | string }[];
}

const emptyRow = () => ({ key: randomId(), materialId: null, gramsUsed: "" as number | string });

interface FinalizeFormProps {
  orderId: number;
  onSaved: () => void;
  onCancel: () => void;
}

function FinalizeForm({ orderId, onSaved, onCancel }: FinalizeFormProps) {
  const { busy, run } = useAsyncAction();
  const { data: materials, loading, reload } = useLoad(getMaterials, [] as Material[]);

  const form = useForm<FinalizeValues>({
    initialValues: {
      deliveryDate: "",
      materialsUsed: [emptyRow()],
    },
    validate: {
      materialsUsed: {
        materialId: (value, values) => {
          if (!value) return "Selecciona un material";
          const repeated = values.materialsUsed.filter((row) => row.materialId === value).length > 1;
          return repeated ? "Material repetido" : null;
        },
        gramsUsed: (value, values, path) => {
          const grams = Number(value);
          if (!value || Number.isNaN(grams) || grams <= 0) return "Ingresa los gramos";
          const index = Number(path.split(".")[1]);
          const material = materials.find(
            (item) => String(item.id) === values.materialsUsed[index]?.materialId,
          );
          if (material && grams > Number(material.stockGrams)) {
            return `Solo hay ${formatGrams(Number(material.stockGrams))} disponibles`;
          }
          return null;
        },
      },
    },
  });

  const materialOptions = materials
    .filter((material) => material.isActive)
    .map((material) => ({
      value: String(material.id),
      label: `${material.type} ${material.color} (${formatGrams(Number(material.stockGrams))})`,
    }));

  const handlePurchased = () => {
    reload();
    form.clearErrors();
  };

  const handleSubmit = async (values: FinalizeValues) => {
    let warning = null as string | null;

    const ok = await run(async () => {
      const result = await finalizePrintOrder(orderId, {
        deliveryDate: values.deliveryDate || undefined,
        materialsUsed: values.materialsUsed.map((row) => ({
          materialId: Number(row.materialId),
          gramsUsed: Number(row.gramsUsed),
        })),
      });
      warning = result.warning;
    }, "Pedido finalizado");

    // El pedido ya está finalizado; el aviso solo informa si el correo no salió
    if (warning) {
      notifyWarning(warning);
    }
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Fecha de entrega (opcional, por defecto hoy)"
          type="date"
          {...form.getInputProps("deliveryDate")}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Material usado
          </Text>
          {form.values.materialsUsed.map((row, index) => (
            <Group key={row.key} align="flex-start" wrap="nowrap">
              <Select
                style={{ flex: 2 }}
                placeholder={loading ? "Cargando..." : "Material"}
                data={materialOptions}
                disabled={loading}
                {...form.getInputProps(`materialsUsed.${index}.materialId`)}
              />
              <NumberInput
                style={{ flex: 1 }}
                placeholder="Gramos"
                min={0}
                decimalScale={2}
                hideControls
                {...form.getInputProps(`materialsUsed.${index}.gramsUsed`)}
              />
              <Button
                variant="subtle"
                color="red"
                disabled={form.values.materialsUsed.length === 1}
                onClick={() => form.removeListItem("materialsUsed", index)}
              >
                Quitar
              </Button>
            </Group>
          ))}
          <Button variant="light" onClick={() => form.insertListItem("materialsUsed", emptyRow())}>
            Agregar material
          </Button>
          <PermissionGate permission="materials:purchase">
            <InlineMaterialPurchase options={materialOptions} onPurchased={handlePurchased} />
          </PermissionGate>
        </Stack>

        <Text size="xs" c="dimmed">
          Al finalizar se descuenta del stock el material indicado. No se puede deshacer.
        </Text>

        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Finalizar pedido" />
      </Stack>
    </form>
  );
}

interface FinalizePrintOrderModalProps {
  opened: boolean;
  orderId: number;
  onClose: () => void;
  onSaved: () => void;
}

export function FinalizePrintOrderModal({
  opened,
  orderId,
  onClose,
  onSaved,
}: FinalizePrintOrderModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Finalizar pedido" centered size="lg">
      <FinalizeForm orderId={orderId} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}