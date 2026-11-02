import { Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { createClient, updateClient } from "../../services/clientService";
import type { Client, ClientCreate } from "../../types/client";
import { FormActions } from "../molecules/FormActions";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface ClientFormValues {
  name: string;
  phone: string;
  email: string;
}

interface ClientFormProps {
  client: Client | null;
  onSaved: () => void;
  onCancel: () => void;
}

function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
  const { busy, run } = useAsyncAction();

  const form = useForm<ClientFormValues>({
    initialValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "Ingresa el nombre";
        if (value.trim().length > 100) return "Máximo 100 caracteres";
        return null;
      },
      phone: (value) => (value.length > 20 ? "Máximo 20 caracteres" : null),
      email: (value) => {
        const email = value.trim();
        if (!email) return null;
        if (email.length > 100) return "Máximo 100 caracteres";
        return emailPattern.test(email) ? null : "El correo no tiene un formato válido";
      },
    },
  });

  const handleSubmit = async (values: ClientFormValues) => {
    const payload: ClientCreate = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
    };

    const ok = await run(
      () => (client ? updateClient(client.id, payload) : createClient(payload)),
      client ? "Cliente actualizado" : "Cliente creado",
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
          placeholder="Ana Rojas"
          maxLength={100}
          {...form.getInputProps("name")}
        />
        <TextInput
          label="Teléfono"
          placeholder="8888-8888"
          maxLength={20}
          {...form.getInputProps("phone")}
        />
        <TextInput
          label="Correo"
          placeholder="ana@correo.com"
          maxLength={100}
          {...form.getInputProps("email")}
        />
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface ClientFormModalProps {
  opened: boolean;
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ClientFormModal({ opened, client, onClose, onSaved }: ClientFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={client ? "Editar cliente" : "Nuevo cliente"}
      centered
    >
      <ClientForm client={client} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}