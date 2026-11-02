import {
  Checkbox,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
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

// Obtiene la fecha actual en formato YYYY-MM-DD
function obtenerFechaActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
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

      estimatedDeliveryDate: (value) => {
        if (!value) {
          return "Ingresa la fecha estimada de entrega";
        }

        if (value < obtenerFechaActual()) {
          return "La fecha no puede ser anterior a hoy";
        }

        return null;
      },

      workDescription: (value) =>
        repair?.status === "inProgress" && !value.trim()
          ? "Describe el trabajo realizado"
          : null,

      workAmount: (value) =>
        repair?.status === "inProgress" && value === ""
          ? "Ingresa el monto del trabajo"
          : value === "" || Number(value) >= 0
            ? null
            : "No puede ser negativo",
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
          ? repair.status === "inProgress"
            ? updateRepair(repair.id, {
                workDescription: values.workDescription.trim(),
                workAmount: Number(values.workAmount),
              })
            : updateRepair(repair.id, {
                problemDescription: values.problemDescription.trim(),
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
    <form noValidate onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {repair?.status === "inProgress" ? (
          <>
            <Text fw={600}>Trabajo de reparación</Text>

            <Text size="sm" c="dimmed">
              Registra el trabajo que se realizó al equipo y su costo.
            </Text>

            <TextInput
              label="Descripción del trabajo realizado"
              description="Indica qué reparación se le hizo al equipo."
              maxLength={255}
              {...form.getInputProps("workDescription")}
            />

            <NumberInput
              label="Monto del trabajo"
              description="Puede ser 0 si no tiene costo."
              decimalScale={2}
              min={0}
              {...form.getInputProps("workAmount")}
            />
          </>
        ) : (
          <>
            <Text fw={600}>Registro del equipo</Text>

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
              placeholder="Computadora, laptop, impresora..."
              maxLength={30}
              {...form.getInputProps("deviceType")}
            />

            <TextInput
              label="Marca"
              placeholder="Apple, Dell, HP..."
              maxLength={30}
              {...form.getInputProps("brand")}
            />

            <TextInput
              label="Modelo"
              placeholder="MacBook, Inspiron, LaserJet..."
              maxLength={30}
              {...form.getInputProps("model")}
            />

            <TextInput
              label="Número de serie"
              description="Opcional."
              maxLength={50}
              {...form.getInputProps("serialNumber")}
            />

            <TextInput
              label="Problema reportado por el cliente"
              maxLength={255}
              {...form.getInputProps("problemDescription")}
            />

            <TextInput
              type="date"
              label="Fecha estimada de entrega"
              {...form.getInputProps("estimatedDeliveryDate")}
            />

            {!repair && (
              <Checkbox
                label="Registrar aunque el equipo ya esté en reparación"
                {...form.getInputProps("allowDuplicate", {
                  type: "checkbox",
                })}
              />
            )}
          </>
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
        repair?.status === "inProgress"
          ? `Registrar trabajo de reparación #${repair.id}`
          : repair
            ? `Editar registro #${repair.id}`
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
