import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useLoad } from "../../hooks/useLoad";
import { finalizeRepair } from "../../services/repairService";
import { getSpareParts } from "../../services/sparePartService";
import type { Repair } from "../../types/repair";
import type { SparePart } from "../../types/sparePart";
import { notifyWarning } from "../../utils/notify";
import { FormActions } from "../molecules/FormActions";

interface SparePartLineValues {
  sparePartId: string | null;
  quantityUsed: number | string;
}

interface RepairFinalizeFormProps {
  repair: Repair;
  onSaved: () => void;
  onCancel: () => void;
}

function RepairFinalizeForm({
  repair,
  onSaved,
  onCancel,
}: RepairFinalizeFormProps) {
  const { busy, run } = useAsyncAction();
  const { data: spareParts } = useLoad(getSpareParts, [] as SparePart[]);

  const form = useForm<{ lines: SparePartLineValues[] }>({
    initialValues: { lines: [] },
    validate: {
      lines: {
        sparePartId: (value) => (value ? null : "Selecciona un repuesto"),
        quantityUsed: (value) =>
          Number.isInteger(Number(value)) && Number(value) > 0
            ? null
            : "Debe ser mayor a 0",
      },
    },
  });

  const handleSubmit = async (values: { lines: SparePartLineValues[] }) => {
    const result = { warning: null as string | null };
    const ok = await run(async () => {
      const response = await finalizeRepair(repair.id, {
        spareParts: values.lines.map((line) => ({
          sparePartId: Number(line.sparePartId),
          quantityUsed: Number(line.quantityUsed),
        })),
      });
      result.warning = response.warning;
    }, "Reparación finalizada");
    if (ok) {
      if (result.warning) {
        notifyWarning(result.warning);
      }
      onSaved();
    }
  };

  const options = spareParts.map((sparePart) => ({
    value: String(sparePart.id),
    label: `${sparePart.name} (${sparePart.brand}) — stock ${sparePart.stockUnits}`,
  }));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Text size="sm" c="dimmed">
          Registra los repuestos usados (opcional). Se descuentan del inventario
          al finalizar.
        </Text>

        {form.values.lines.map((_, index) => (
          <Group key={index} align="flex-start" wrap="nowrap">
            <Select
              style={{ flex: 1 }}
              placeholder="Repuesto"
              searchable
              data={options}
              {...form.getInputProps(`lines.${index}.sparePartId`)}
            />
            <NumberInput
              w={90}
              placeholder="Cant."
              allowDecimal={false}
              allowNegative={false}
              min={1}
              {...form.getInputProps(`lines.${index}.quantityUsed`)}
            />
            <Button
              variant="light"
              color="red"
              onClick={() => form.removeListItem("lines", index)}
            >
              Quitar
            </Button>
          </Group>
        ))}

        <Group>
          <Button
            variant="default"
            size="xs"
            onClick={() =>
              form.insertListItem("lines", {
                sparePartId: null,
                quantityUsed: 1,
              })
            }
          >
            Agregar repuesto
          </Button>
        </Group>

        <FormActions
          submitting={busy}
          onCancel={onCancel}
          submitLabel="Finalizar"
        />
      </Stack>
    </form>
  );
}

interface RepairFinalizeModalProps {
  opened: boolean;
  repair: Repair | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RepairFinalizeModal({
  opened,
  repair,
  onClose,
  onSaved,
}: RepairFinalizeModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        repair ? `Finalizar reparación #${repair.id}` : "Finalizar reparación"
      }
      centered
    >
      {repair && (
        <RepairFinalizeForm
          repair={repair}
          onSaved={onSaved}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
