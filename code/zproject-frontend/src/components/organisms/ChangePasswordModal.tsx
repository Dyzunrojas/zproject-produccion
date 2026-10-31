import { Modal, PasswordInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { changePassword } from "../../services/authService";
import { FormActions } from "../molecules/FormActions";

interface ChangePasswordFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

function ChangePasswordForm({ onSaved, onCancel }: ChangePasswordFormProps) {
  const { busy, run } = useAsyncAction();
  const form = useForm({
    initialValues: { currentPassword: "", newPassword: "", confirm: "" },
    validate: {
      currentPassword: (value) => (value ? null : "Ingresa tu contraseña actual"),
      newPassword: (value) =>
        value.length >= 8 && value.length <= 72 ? null : "Debe tener entre 8 y 72 caracteres",
      confirm: (value, values) => (value === values.newPassword ? null : "No coinciden"),
    },
  });

  const handleSubmit = async (values: { currentPassword: string; newPassword: string }) => {
    const ok = await run(
      () => changePassword(values.currentPassword, values.newPassword),
      "Contraseña actualizada",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <PasswordInput label="Contraseña actual" {...form.getInputProps("currentPassword")} />
        <PasswordInput label="Nueva contraseña" {...form.getInputProps("newPassword")} />
        <PasswordInput label="Confirmar nueva contraseña" {...form.getInputProps("confirm")} />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Cambiar" />
      </Stack>
    </form>
  );
}

interface ChangePasswordModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Cambiar mi contraseña" centered>
      <ChangePasswordForm onSaved={onClose} onCancel={onClose} />
    </Modal>
  );
}