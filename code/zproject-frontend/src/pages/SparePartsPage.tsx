import { Button, Group } from "@mantine/core";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { SparePartFormModal } from "../components/organisms/SparePartFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { deleteSparePart, getSpareParts } from "../services/sparePartService";
import type { SparePart } from "../types/sparePart";

export function SparePartsPage() {
  const {
    data: spareParts,
    loading,
    reload,
  } = useLoad(getSpareParts, [] as SparePart[]);

  const formModal = useItemModal<SparePart>();
  const deleteModal = useItemModal<SparePart>();
  const { busy: deleteBusy, run } = useAsyncAction();

  const handleSaved = () => {
    formModal.close();
    reload();
  };

  const handleDelete = async () => {
    const target = deleteModal.item;
    if (!target) return;
    const ok = await run(
      () => deleteSparePart(target.id),
      "Repuesto eliminado",
    );
    if (ok) {
      deleteModal.close();
      reload();
    }
  };

  const columns: Column<SparePart>[] = [
    { header: "Nombre", render: (sparePart) => sparePart.name },
    { header: "Marca", render: (sparePart) => sparePart.brand },
    { header: "Número de parte", render: (sparePart) => sparePart.partNumber },
    {
      header: "Tipo",
      render: (sparePart) =>
        sparePart.isOriginal ? "Original" : "Alternativo",
    },
    { header: "Stock (unidades)", render: (sparePart) => sparePart.stockUnits },
    {
      header: "Acciones",
      render: (sparePart) => (
        <Group gap="xs">
          <PermissionGate permission="spare_parts:update">
            <Button
              size="xs"
              variant="default"
              onClick={() => formModal.open(sparePart)}
            >
              Editar
            </Button>
          </PermissionGate>
          <PermissionGate permission="spare_parts:delete">
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => deleteModal.open(sparePart)}
            >
              Eliminar
            </Button>
          </PermissionGate>
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Repuestos"
        actions={
          <PermissionGate permission="spare_parts:create">
            <Button onClick={() => formModal.open()}>Nuevo repuesto</Button>
          </PermissionGate>
        }
      />

      <DataTable
        rows={spareParts}
        columns={columns}
        getRowKey={(sparePart) => sparePart.id}
        loading={loading}
        emptyMessage="No hay repuestos registrados."
      />

      <SparePartFormModal
        opened={formModal.opened}
        sparePart={formModal.item}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={deleteModal.opened}
        title="Eliminar repuesto"
        message={
          deleteModal.item
            ? `¿Eliminar ${deleteModal.item.name} (${deleteModal.item.brand})? El historial de reparaciones que lo usaron se conserva.`
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
