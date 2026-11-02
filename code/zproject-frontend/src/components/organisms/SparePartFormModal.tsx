import { Modal, NumberInput, Stack, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  createSparePart,
  updateSparePart,
} from "../../services/sparePartService";
import type { SparePart } from "../../types/sparePart";
import { FormActions } from "../molecules/FormActions";

interface SparePartFormValues {
  name: string;
  brand: string;
  partNumber: string;
  isOriginal: boolean;
  stockUnits: number | string;
}

interface SparePartFormProps {
  sparePart: SparePart | null;
  onSaved: () => void;
  onCancel: () => void;
}

function SparePartForm({ sparePart, onSaved, onCancel }: SparePartFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<SparePartFormValues>({
    initialValues: {
      name: sparePart?.name ?? "",
      brand: sparePart?.brand ?? "",
      partNumber: sparePart?.partNumber ?? "",
      isOriginal: sparePart?.isOriginal ?? false,
      stockUnits: sparePart?.stockUnits ?? 0,
    },
    validate: {
      name: (value) => (value.trim() ? null : "Ingresa el nombre del repuesto"),
      brand: (value) => (value.trim() ? null : "Ingresa la marca"),
      partNumber: (value) =>
        value.trim() ? null : "Ingresa el número de parte",
      stockUnits: (value) =>
        value !== "" && Number(value) >= 0 ? null : "No puede ser negativo",
    },
  });

  const handleSubmit = async (values: SparePartFormValues) => {
    const payload = {
      name: values.name.trim(),
      brand: values.brand.trim(),
      partNumber: values.partNumber.trim(),
      isOriginal: values.isOriginal,
      stockUnits: Number(values.stockUnits),
    };
    const ok = await run(
      () =>
        sparePart
          ? updateSparePart(sparePart.id, payload)
          : createSparePart(payload),
      sparePart ? "Repuesto actualizado" : "Repuesto creado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Nombre"
          placeholder="Tornillo, pieza de repuesto..."
          maxLength={100}
          {...form.getInputProps("name")}
        />
        <TextInput
          label="Marca"
          placeholder="Apple, Dell, HP..."
          maxLength={30}
          {...form.getInputProps("brand")}
        />
        <TextInput
          label="Número de parte"
          placeholder="12345, ABC-123..."
          maxLength={50}
          {...form.getInputProps("partNumber")}
        />
        <Switch
          label="Repuesto original"
          {...form.getInputProps("isOriginal", { type: "checkbox" })}
        />
        <NumberInput
          label="Stock (unidades)"
          allowDecimal={false}
          allowNegative={false}
          min={0}
          {...form.getInputProps("stockUnits")}
        />
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface SparePartFormModalProps {
  opened: boolean;
  sparePart: SparePart | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SparePartFormModal({
  opened,
  sparePart,
  onClose,
  onSaved,
}: SparePartFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={sparePart ? "Editar repuesto" : "Nuevo repuesto"}
      centered
    >
      <SparePartForm
        sparePart={sparePart}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  );
}
