import { Modal, PasswordInput, Select, Stack, Switch, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useAuth } from "../../hooks/useAuth";
import { createUser, updateUser } from "../../services/authService";
import type { Role, UserSummary } from "../../types/auth";
import { FormActions } from "../molecules/FormActions";

interface UserFormValues {
  username: string;
  password: string;
  roleId: string | null;
  isActive: boolean;
}

interface UserFormProps {
  user: UserSummary | null;
  roles: Role[];
  onSaved: () => void;
  onCancel: () => void;
}

function UserForm({ user, roles, onSaved, onCancel }: UserFormProps) {
  const { busy, run } = useAsyncAction();
  const { user: currentUser } = useAuth();
  const isSelf = user !== null && user.id === currentUser?.id;

  const form = useForm<UserFormValues>({
    initialValues: {
      username: user?.username ?? "",
      password: "",
      roleId: user ? String(user.role.id) : null,
      isActive: user?.isActive ?? true,
    },
    validate: {
      username: (value) =>
        user !== null || value.trim().length >= 3 ? null : "Mínimo 3 caracteres",
      password: (value) =>
        user !== null || (value.length >= 8 && value.length <= 72)
          ? null
          : "Debe tener entre 8 y 72 caracteres",
      roleId: (value) => (value ? null : "Selecciona un rol"),
    },
  });

  const roleOptions = roles.map((role) => ({ value: String(role.id), label: role.name }));

  const handleSubmit = async (values: UserFormValues) => {
    if (isSelf) {
      onCancel();
      return;
    }
    const roleId = Number(values.roleId);
    const ok = await run(
      () =>
        user
          ? updateUser(user.id, { roleId, isActive: values.isActive })
          : createUser({ username: values.username.trim(), password: values.password, roleId }),
      user ? "Usuario actualizado" : "Usuario creado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Usuario"
          disabled={user !== null}
          {...form.getInputProps("username")}
        />
        {user === null && (
          <PasswordInput
            label="Contraseña inicial"
            description="Entre 8 y 72 caracteres. El empleado podrá cambiarla después."
            {...form.getInputProps("password")}
          />
        )}
        <Select
          label="Rol"
          data={roleOptions}
          disabled={isSelf}
          {...form.getInputProps("roleId")}
        />
        {user !== null && (
          <Switch
            label="Usuario activo"
            disabled={isSelf}
            checked={form.values.isActive}
            onChange={(event) => form.setFieldValue("isActive", event.currentTarget.checked)}
          />
        )}
        {isSelf && (
          <Text size="xs" c="dimmed">
            No puedes cambiar tu propio rol ni desactivarte.
          </Text>
        )}
        <FormActions submitting={busy} onCancel={onCancel} />
      </Stack>
    </form>
  );
}

interface UserFormModalProps {
  opened: boolean;
  user: UserSummary | null; // null = crear, con valor = editar
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}

export function UserFormModal({ opened, user, roles, onClose, onSaved }: UserFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      centered
    >
      <UserForm user={user} roles={roles} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}