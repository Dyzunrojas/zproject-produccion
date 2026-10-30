import { Modal, NumberInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { purchaseMaterial } from "../../services/materialService";
import type { Material } from "../../types/material";
import { FormActions } from "../molecules/FormActions";

interface PurchaseFormProps {
  material: Material;
  onSaved: () => void;
  onCancel: () => void;
}

function PurchaseForm({ material, onSaved, onCancel }: PurchaseFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<{ grams: number | string }>({
    initialValues: { grams: "" },
    validate: {
      grams: (value) => (Number(value) > 0 ? null : "Ingresa los gramos comprados"),
    },
  });

  const handleSubmit = async (values: { grams: number | string }) => {
    const ok = await run(
      () => purchaseMaterial(material.id, { grams: Number(values.grams) }),
      "Compra registrada",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Text size="sm">
          {material.type} {material.color} · Stock actual: {material.stockGrams} g
        </Text>
        <NumberInput
          label="Gramos comprados"
          decimalScale={2}
          min={0}
          {...form.getInputProps("grams")}
        />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Registrar compra" />
      </Stack>
    </form>
  );
}

interface MaterialPurchaseModalProps {
  opened: boolean;
  material: Material | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MaterialPurchaseModal({
  opened,
  material,
  onClose,
  onSaved,
}: MaterialPurchaseModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Registrar compra de material" centered>
      {material && <PurchaseForm material={material} onSaved={onSaved} onCancel={onClose} />}
    </Modal>
  );
}