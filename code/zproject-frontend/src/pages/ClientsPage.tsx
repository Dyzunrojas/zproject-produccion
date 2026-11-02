import { Button, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useCallback, useState } from "react";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { ClientFormModal } from "../components/organisms/ClientFormModal";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { deleteClient, getClients } from "../services/clientService";
import type { Client } from "../types/client";

const columns: Column<Client>[] = [
  { header: "Nombre", render: (client) => client.name },
  { header: "Teléfono", render: (client) => client.phone || "—" },
  { header: "Correo", render: (client) => client.email || "—" },
];

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);

  const fetcher = useCallback(
    () => getClients(debouncedSearch || undefined),
    [debouncedSearch],
  );
  const { data: clients, loading, reload } = useLoad(fetcher, [] as Client[]);

  const formModal = useItemModal<Client>();
  const deleteModal = useItemModal<Client>();
  const { busy: deleteBusy, run } = useAsyncAction();

  const handleSaved = () => {
    formModal.close();
    reload();
  };

  const handleDelete = async () => {
    const target = deleteModal.item;
    if (!target) return;
    const ok = await run(() => deleteClient(target.id), "Cliente eliminado");
    if (ok) {
      deleteModal.close();
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        actions={
          <PermissionGate permission="clients:create">
            <Button onClick={() => formModal.open()}>Nuevo cliente</Button>
          </PermissionGate>
        }
      />

      <TextInput
        mb="md"
        w={300}
        placeholder="Buscar por nombre"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      <DataTable
        rows={clients}
        columns={columns}
        getRowKey={(client) => client.id}
        loading={loading}
        emptyMessage={
          debouncedSearch
            ? "Ningún cliente coincide con la búsqueda."
            : "No hay clientes registrados."
        }
        onEdit={(client) => formModal.open(client)}
        onDelete={(client) => deleteModal.open(client)}
        editPermission="clients:update"
        deletePermission="clients:delete"
      />

      <ClientFormModal
        opened={formModal.opened}
        client={formModal.item}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={deleteModal.opened}
        title="Eliminar cliente"
        message={
          deleteModal.item
            ? `¿Eliminar a ${deleteModal.item.name}? Sus pedidos y reparaciones se conservan.`
            : ""
        }
        confirmLabel="Eliminar"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onCancel={deleteModal.close}
      />
    </>
  );
}