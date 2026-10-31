import { Modal, Select, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { changeRepairStatus } from "../../services/repairService";
import type { Repair } from "../../types/repair";
import { changeableStatusOptions } from "../../utils/repairStatus";
import { FormActions } from "../molecules/FormActions";

interface RepairStatusFormProps {
  repair: Repair;
  onSaved: () => void;
  onCancel: () => void;
}

function RepairStatusForm({
  repair,
  onSaved,
  onCancel,
}: RepairStatusFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<{ status: string | null }>({
    initialValues: { status: repair.status },
    validate: {
      status: (value) => (value ? null : "Selecciona un estado"),
    },
  });

  const handleSubmit = async (values: { status: string | null }) => {
    const ok = await run(
      () => changeRepairStatus(repair.id, { status: values.status ?? "" }),
      "Estado actualizado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Select
          label="Estado"
          data={changeableStatusOptions}
          {...form.getInputProps("status")}
        />
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface RepairStatusModalProps {
  opened: boolean;
  repair: Repair | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RepairStatusModal({
  opened,
  repair,
  onClose,
  onSaved,
}: RepairStatusModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={repair ? `Estado de la reparación #${repair.id}` : "Estado"}
      centered
    >
      {repair && (
        <RepairStatusForm
          repair={repair}
          onSaved={onSaved}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
