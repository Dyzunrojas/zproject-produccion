import { Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import axios from "axios";
import { useState } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useLoad } from "../../hooks/useLoad";
import { getRepairs } from "../../services/repairService";
import { createWarranty, updateWarranty } from "../../services/warrantyService";
import type { Repair } from "../../types/repair";
import type { Warranty, WarrantyCreate } from "../../types/warranty";
import { notifyError, notifySuccess } from "../../utils/notify";
import { FormActions } from "../molecules/FormActions";

interface WarrantyFormValues {
  repairOrderId: string | null;
  startDate: string;
  expirationDate: string;
  conditions: string;
}

interface WarrantyFormProps {
  warranty: Warranty | null;
  onSaved: () => void;
  onCancel: () => void;
}

function WarrantyForm({ warranty, onSaved, onCancel }: WarrantyFormProps) {
  const { busy, run } = useAsyncAction();
  const [duplicate, setDuplicate] = useState<WarrantyCreate | null>(null);
  const { data: repairs, loading: repairsLoading } = useLoad(
    getRepairs,
    [] as Repair[],
  );

  const repairOptions = repairs.map((repair) => ({
    value: String(repair.id),
    label: `#${repair.id} · ${repair.device.brand} ${repair.device.model} · ${repair.problemDescription}`,
  }));

  const form = useForm<WarrantyFormValues>({
    initialValues: {
      repairOrderId: warranty ? String(warranty.repairOrderId) : null,
      startDate: (warranty?.startDate ?? "").slice(0, 10),
      expirationDate: (warranty?.expirationDate ?? "").slice(0, 10),
      conditions: warranty?.conditions ?? "",
    },
    validate: {
      repairOrderId: (value) => (value ? null : "Selecciona una reparación"),
      startDate: (value) => (value ? null : "Selecciona la fecha de inicio"),
      expirationDate: (value, values) => {
        if (!value) return "Selecciona la fecha de expiración";
        return value >= values.startDate
          ? null
          : "La fecha de expiración debe ser posterior al inicio";
      },
      conditions: (value) =>
        !value.trim() ? "Ingresa las condiciones de la garantía" : null,
    },
  });

  const handleSubmit = async (values: WarrantyFormValues) => {
    const payload: WarrantyCreate = {
      repairOrderId: Number(values.repairOrderId),
      startDate: values.startDate,
      expirationDate: values.expirationDate,
      conditions: values.conditions.trim(),
    };

    if (warranty) {
      const ok = await run(async () => {
        try {
          await updateWarranty(warranty.id, payload);
          notifySuccess("Garantía actualizada");
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            notifyError(error);
            return;
          }
          throw error;
        }
      });
      if (ok) onSaved();
      return;
    }

    let conflict = false;
    const ok = await run(async () => {
      try {
        await createWarranty(payload);
        notifySuccess("Garantía creada");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          conflict = true;
          setDuplicate(payload);
          return;
        }
        throw error;
      }
    });
    if (ok && !conflict) onSaved();
  };

  const handleForce = async () => {
    if (!duplicate) return;
    const ok = await run(
      () => createWarranty(duplicate, true),
      "Garantía creada",
    );
    if (ok) {
      setDuplicate(null);
      onSaved();
    }
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Reparación"
            placeholder="Selecciona una reparación"
            data={repairOptions}
            searchable
            allowDeselect={false}
            disabled={repairsLoading || warranty !== null}
            nothingFoundMessage="No hay reparaciones registradas"
            {...form.getInputProps("repairOrderId")}
          />
          <TextInput
            label="Fecha de inicio"
            type="date"
            {...form.getInputProps("startDate")}
          />
          <TextInput
            label="Fecha de expiración"
            type="date"
            {...form.getInputProps("expirationDate")}
          />
          <TextInput
            label="Condiciones"
            maxLength={255}
            {...form.getInputProps("conditions")}
          />
          <FormActions submitting={busy} onCancel={onCancel} />
        </Stack>
      </form>

      <Modal
        opened={duplicate !== null}
        onClose={() => setDuplicate(null)}
        title="Garantía vigente"
        centered
      >
        <Stack>
          <Text>
            Esa reparación ya tiene una garantía vigente. ¿Deseas registrar otra
            de todas formas?
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDuplicate(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button onClick={handleForce} loading={busy}>
              Crear de todas formas
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

interface WarrantyFormModalProps {
  opened: boolean;
  warranty: Warranty | null;
  onClose: () => void;
  onSaved: () => void;
}

export function WarrantyFormModal({
  opened,
  warranty,
  onClose,
  onSaved,
}: WarrantyFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={warranty ? "Editar garantía" : "Nueva garantía"}
      centered
    >
      <WarrantyForm
        warranty={warranty}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  );
}
