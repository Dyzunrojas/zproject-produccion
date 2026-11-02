import {
  Checkbox,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { createRepair, updateRepair } from "../../services/repairService";
import type { Client } from "../../types/client";
import type { Repair } from "../../types/repair";
import { buildClientOptions } from "../../utils/clientOptions";
import { FormActions } from "../molecules/FormActions";

interface RepairFormValues {
  clientId: string | null;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  problemDescription: string;
  workDescription: string;
  workAmount: number | string;
  estimatedDeliveryDate: string;
  allowDuplicate: boolean;
}

interface RepairFormProps {
  repair: Repair | null;
  clients: Client[];
  onSaved: () => void;
  onCancel: () => void;
}

function RepairForm({ repair, clients, onSaved, onCancel }: RepairFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<RepairFormValues>({
    initialValues: {
      clientId: repair ? String(repair.clientId) : null,
      deviceType: repair?.device.type ?? "",
      brand: repair?.device.brand ?? "",
      model: repair?.device.model ?? "",
      serialNumber: repair?.device.serialNumber ?? "",
      problemDescription: repair?.problemDescription ?? "",
      workDescription: repair?.workDescription ?? "",
      workAmount: repair?.workAmount ?? "",
      estimatedDeliveryDate: repair?.estimatedDeliveryDate.slice(0, 10) ?? "",
      allowDuplicate: false,
    },
    validate: {
      clientId: (value) => (value ? null : "Selecciona un cliente"),
      deviceType: (value) =>
        value.trim() ? null : "Ingresa el tipo de equipo",
      brand: (value) => (value.trim() ? null : "Ingresa la marca"),
      model: (value) => (value.trim() ? null : "Ingresa el modelo"),
      problemDescription: (value) =>
        value.trim() ? null : "Describe el problema",
      estimatedDeliveryDate: (value) =>
        value ? null : "Ingresa la fecha estimada de entrega",
      workAmount: (value) =>
        value === "" || Number(value) >= 0 ? null : "No puede ser negativo",
    },
  });

  const handleSubmit = async (values: RepairFormValues) => {
    const device = {
      type: values.deviceType.trim(),
      brand: values.brand.trim(),
      model: values.model.trim(),
      serialNumber: values.serialNumber.trim() || null,
    };
    const ok = await run(
      () =>
        repair
          ? updateRepair(repair.id, {
              problemDescription: values.problemDescription.trim(),
              workDescription: values.workDescription.trim(),
              workAmount:
                values.workAmount === ""
                  ? undefined
                  : Number(values.workAmount),
              estimatedDeliveryDate: values.estimatedDeliveryDate,
              device,
            })
          : createRepair({
              clientId: Number(values.clientId),
              device,
              problemDescription: values.problemDescription.trim(),
              estimatedDeliveryDate: values.estimatedDeliveryDate,
              allowDuplicate: values.allowDuplicate,
            }),
      repair ? "Reparación actualizada" : "Equipo registrado",
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
          placeholder="Escribe para buscar un cliente"
          searchable
          nothingFoundMessage="No se encontraron clientes"
          disabled={repair !== null}
          data={buildClientOptions(clients, repair?.clientId)}
          {...form.getInputProps("clientId")}
        />
        <TextInput
          label="Tipo de equipo"
          placeholder="Celular, laptop, consola..."
          maxLength={30}
          {...form.getInputProps("deviceType")}
        />
        <TextInput
          label="Marca"
          maxLength={30}
          {...form.getInputProps("brand")}
        />
        <TextInput
          label="Modelo"
          maxLength={30}
          {...form.getInputProps("model")}
        />
        <TextInput
          label="Número de serie"
          description="Opcional. Sirve para detectar equipos que ya están en reparación."
          maxLength={50}
          {...form.getInputProps("serialNumber")}
        />
        <TextInput
          label="Descripción del problema"
          maxLength={255}
          {...form.getInputProps("problemDescription")}
        />
        <TextInput
          type="date"
          label="Fecha estimada de entrega"
          {...form.getInputProps("estimatedDeliveryDate")}
        />
        {repair ? (
          <>
            <TextInput
              label="Descripción del trabajo"
              maxLength={255}
              {...form.getInputProps("workDescription")}
            />
            <NumberInput
              label="Monto del trabajo"
              decimalScale={2}
              min={0}
              {...form.getInputProps("workAmount")}
            />
          </>
        ) : (
          <Checkbox
            label="Registrar aunque el equipo ya esté en reparación"
            {...form.getInputProps("allowDuplicate", { type: "checkbox" })}
          />
        )}
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface RepairFormModalProps {
  opened: boolean;
  repair: Repair | null;
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}

export function RepairFormModal({
  opened,
  repair,
  clients,
  onClose,
  onSaved,
}: RepairFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        repair
          ? `Editar reparación #${repair.id}`
          : "Registrar equipo a reparar"
      }
      centered
    >
      <RepairForm
        repair={repair}
        clients={clients}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  );
}
