import { Badge, Button } from "@mantine/core";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { ResetPasswordModal } from "../components/organisms/ResetPasswordModal";
import { UserFormModal } from "../components/organisms/UserFormModal";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { getRoles, getUsers } from "../services/authService";
import type { Role, UserSummary } from "../types/auth";

const columns: Column<UserSummary>[] = [
  { header: "Usuario", render: (user) => user.username },
  { header: "Rol", render: (user) => user.role.name },
  {
    header: "Estado",
    render: (user) => (
      <Badge color={user.isActive ? "green" : "gray"}>{user.isActive ? "Activo" : "Inactivo"}</Badge>
    ),
  },
];

export function UsersPage() {
  const { data: users, loading, reload } = useLoad(getUsers, [] as UserSummary[]);
  const { data: roles } = useLoad(getRoles, [] as Role[]);

  const formModal = useItemModal<UserSummary>();
  const passwordModal = useItemModal<UserSummary>();

  const handleSaved = () => {
    formModal.close();
    passwordModal.close();
    reload();
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        actions={<Button onClick={() => formModal.open()}>Nuevo usuario</Button>}
      />

      <DataTable
        rows={users}
        columns={columns}
        getRowKey={(user) => user.id}
        loading={loading}
        emptyMessage="No hay usuarios registrados."
        onEdit={(user) => formModal.open(user)}
        renderActions={(user) => (
          <Button size="xs" variant="default" onClick={() => passwordModal.open(user)}>
            Contraseña
          </Button>
        )}
      />

      <UserFormModal
        opened={formModal.opened}
        user={formModal.item}
        roles={roles}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <ResetPasswordModal
        opened={passwordModal.opened}
        user={passwordModal.item}
        onClose={passwordModal.close}
        onSaved={handleSaved}
      />
    </>
  );
}