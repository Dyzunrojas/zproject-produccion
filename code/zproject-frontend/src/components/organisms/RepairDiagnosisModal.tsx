import { Modal, NumberInput, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { registerDiagnosis } from "../../services/repairService";
import type { Repair } from "../../types/repair";
import { FormActions } from "../molecules/FormActions";

interface RepairDiagnosisValues {
  diagnosis: string;
  diagnosisAmount: number | string;
}

interface RepairDiagnosisFormProps {
  repair: Repair;
  onSaved: () => void;
  onCancel: () => void;
}

function RepairDiagnosisForm({
  repair,
  onSaved,
  onCancel,
}: RepairDiagnosisFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<RepairDiagnosisValues>({
    initialValues: {
      diagnosis: repair.diagnosis ?? "",
      diagnosisAmount: repair.diagnosisAmount ?? 0,
    },
    validate: {
      diagnosis: (value) => (value.trim() ? null : "Ingresa el diagnóstico"),
      diagnosisAmount: (value) =>
        value !== "" && Number(value) >= 0 ? null : "No puede ser negativo",
    },
  });

  const handleSubmit = async (values: RepairDiagnosisValues) => {
    const ok = await run(
      () =>
        registerDiagnosis(repair.id, {
          diagnosis: values.diagnosis.trim(),
          diagnosisAmount: Number(values.diagnosisAmount),
        }),
      "Diagnóstico guardado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Textarea
          label="Diagnóstico"
          autosize
          minRows={3}
          maxLength={255}
          {...form.getInputProps("diagnosis")}
        />
        <NumberInput
          label="Monto del diagnóstico"
          decimalScale={2}
          min={0}
          {...form.getInputProps("diagnosisAmount")}
        />
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface RepairDiagnosisModalProps {
  opened: boolean;
  repair: Repair | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RepairDiagnosisModal({
  opened,
  repair,
  onClose,
  onSaved,
}: RepairDiagnosisModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        repair ? `Diagnóstico de la reparación #${repair.id}` : "Diagnóstico"
      }
      centered
    >
      {repair && (
        <RepairDiagnosisForm
          repair={repair}
          onSaved={onSaved}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
