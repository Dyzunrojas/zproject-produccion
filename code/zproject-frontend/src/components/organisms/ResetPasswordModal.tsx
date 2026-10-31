import { Modal, PasswordInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { resetPassword } from "../../services/authService";
import type { UserSummary } from "../../types/auth";
import { FormActions } from "../molecules/FormActions";

interface ResetPasswordFormProps {
  user: UserSummary;
  onSaved: () => void;
  onCancel: () => void;
}

function ResetPasswordForm({ user, onSaved, onCancel }: ResetPasswordFormProps) {
  const { busy, run } = useAsyncAction();
  const form = useForm({
    initialValues: { newPassword: "", confirm: "" },
    validate: {
      newPassword: (value) =>
        value.length >= 8 && value.length <= 72 ? null : "Debe tener entre 8 y 72 caracteres",
      confirm: (value, values) => (value === values.newPassword ? null : "No coinciden"),
    },
  });

  const handleSubmit = async (values: { newPassword: string }) => {
    const ok = await run(
      () => resetPassword(user.id, values.newPassword),
      `Contraseña de ${user.username} restablecida`,
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <PasswordInput label="Nueva contraseña" {...form.getInputProps("newPassword")} />
        <PasswordInput label="Confirmar contraseña" {...form.getInputProps("confirm")} />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Restablecer" />
      </Stack>
    </form>
  );
}

interface ResetPasswordModalProps {
  opened: boolean;
  user: UserSummary | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ResetPasswordModal({ opened, user, onClose, onSaved }: ResetPasswordModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={user ? `Restablecer contraseña de ${user.username}` : ""}
      centered
    >
      {user && <ResetPasswordForm user={user} onSaved={onSaved} onCancel={onClose} />}
    </Modal>
  );
}