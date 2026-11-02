import { Autocomplete, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { createMaterial, updateMaterial } from "../../services/materialService";
import type { Material } from "../../types/material";
import { validateColor, validateMaterialType } from "../../utils/validators";
import { FormActions } from "../molecules/FormActions";

interface MaterialFormValues {
  type: string;
  color: string;
  diameter: number | string;
  stockGrams: number | string;
}

interface MaterialFormProps {
  material: Material | null;
  onSaved: () => void;
  onCancel: () => void;
}

function MaterialForm({ material, onSaved, onCancel }: MaterialFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<MaterialFormValues>({
    initialValues: {
      type: material?.type ?? "",
      color: material?.color ?? "",
      diameter: material?.diameter ?? 1.75,
      stockGrams: material?.stockGrams ?? 0,
    },
    validate: {
      type: validateMaterialType,
      color: validateColor,
      diameter: (value) => (Number(value) > 0 ? null : "Debe ser mayor a 0"),
      stockGrams: (value) =>
        value !== "" && Number(value) >= 0 ? null : "No puede ser negativo",
    },
  });

  const handleSubmit = async (values: MaterialFormValues) => {
    const payload = {
      type: values.type.trim(),
      color: values.color.trim(),
      diameter: Number(values.diameter),
      stockGrams: Number(values.stockGrams),
    };
    const ok = await run(
      () => (material ? updateMaterial(material.id, payload) : createMaterial(payload)),
      material ? "Material actualizado" : "Material creado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Autocomplete
          label="Tipo"
          placeholder="PLA, PETG, ABS..."
          data={["PLA", "PETG", "ABS", "TPU"]}
          {...form.getInputProps("type")}
        />
        <TextInput label="Color" placeholder="Negro" {...form.getInputProps("color")} />
        <NumberInput
          label="Diámetro (mm)"
          decimalScale={2}
          min={0}
          {...form.getInputProps("diameter")}
        />
        <NumberInput
          label="Stock (gramos)"
          decimalScale={2}
          min={0}
          {...form.getInputProps("stockGrams")}
        />
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface MaterialFormModalProps {
  opened: boolean;
  material: Material | null; // null = crear, con valor = editar
  onClose: () => void;
  onSaved: () => void;
}

export function MaterialFormModal({ opened, material, onClose, onSaved }: MaterialFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={material ? "Editar material" : "Nuevo material"}
      centered
    >
      <MaterialForm material={material} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}