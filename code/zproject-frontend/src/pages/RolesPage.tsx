import { Button } from "@mantine/core";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { RoleFormModal } from "../components/organisms/RoleFormModal";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { getPermissions, getRoles } from "../services/authService";
import type { Permission, Role } from "../types/auth";

const columns: Column<Role>[] = [
  { header: "Rol", render: (role) => role.name },
  { header: "Permisos", render: (role) => `${role.permissions.length} permisos` },
];

export function RolesPage() {
  const { data: roles, loading, reload } = useLoad(getRoles, [] as Role[]);
  const { data: permissions } = useLoad(getPermissions, [] as Permission[]);
  const formModal = useItemModal<Role>();

  const handleSaved = () => {
    formModal.close();
    reload();
  };

  return (
    <>
      <PageHeader
        title="Roles"
        actions={<Button onClick={() => formModal.open()}>Nuevo rol</Button>}
      />

      <DataTable
        rows={roles}
        columns={columns}
        getRowKey={(role) => role.id}
        loading={loading}
        emptyMessage="No hay roles registrados."
        onEdit={(role) => formModal.open(role)}
      />

      <RoleFormModal
        opened={formModal.opened}
        role={formModal.item}
        permissions={permissions}
        onClose={formModal.close}
        onSaved={handleSaved}
      />
    </>
  );
}