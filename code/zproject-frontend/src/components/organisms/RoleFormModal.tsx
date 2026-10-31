import { Modal, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { createRole, updateRole } from "../../services/authService";
import type { Permission, Role } from "../../types/auth";
import { FormActions } from "../molecules/FormActions";
import { PermissionMatrix } from "./PermissionMatrix";

interface RoleFormValues {
  name: string;
  permissionCodes: string[];
}

interface RoleFormProps {
  role: Role | null;
  permissions: Permission[];
  onSaved: () => void;
  onCancel: () => void;
}

function RoleForm({ role, permissions, onSaved, onCancel }: RoleFormProps) {
  const { busy, run } = useAsyncAction();
  const form = useForm<RoleFormValues>({
    initialValues: {
      name: role?.name ?? "",
      permissionCodes: role?.permissions.map((permission) => permission.code) ?? [],
    },
    validate: {
      name: (value) => (value.trim() ? null : "Ingresa el nombre del rol"),
      permissionCodes: (value) => (value.length > 0 ? null : "Marca al menos un permiso"),
    },
  });

  const handleSubmit = async (values: RoleFormValues) => {
    const payload = { name: values.name.trim(), permissionCodes: values.permissionCodes };
    const ok = await run(
      () => (role ? updateRole(role.id, payload) : createRole(payload)),
      role ? "Rol actualizado" : "Rol creado",
    );
    if (ok) {
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Nombre del rol"
          placeholder="Encargado de impresión 3D"
          {...form.getInputProps("name")}
        />

        <Text size="sm" fw={500}>
          Permisos
        </Text>
        <PermissionMatrix
          permissions={permissions}
          value={form.values.permissionCodes}
          onChange={(codes) => form.setFieldValue("permissionCodes", codes)}
        />
        {form.errors.permissionCodes && (
          <Text size="xs" c="red">
            {form.errors.permissionCodes}
          </Text>
        )}

        <FormActions
          submitting={busy}
          onCancel={onCancel}
          submitLabel={role ? "Guardar cambios" : "Crear rol"}
        />
      </Stack>
    </form>
  );
}

interface RoleFormModalProps {
  opened: boolean;
  role: Role | null; // null = crear, con valor = editar
  permissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}

export function RoleFormModal({ opened, role, permissions, onClose, onSaved }: RoleFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={role ? `Editar rol: ${role.name}` : "Nuevo rol"}
      centered
      size="xl"
    >
      <RoleForm role={role} permissions={permissions} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}