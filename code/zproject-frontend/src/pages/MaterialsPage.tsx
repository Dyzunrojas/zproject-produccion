import { Button } from "@mantine/core";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { MaterialFormModal } from "../components/organisms/MaterialFormModal";
import { MaterialPurchaseModal } from "../components/organisms/MaterialPurchaseModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { deleteMaterial, getMaterials } from "../services/materialService";
import type { Material } from "../types/material";
import { formatGrams } from "../utils/format";

const columns: Column<Material>[] = [
  { header: "Tipo", render: (material) => material.type },
  { header: "Color", render: (material) => material.color },
  { header: "Diámetro (mm)", render: (material) => material.diameter },
  { header: "Stock (g)", render: (material) => formatGrams(material.stockGrams) },
];

export function MaterialsPage() {
  const { data: materials, loading, reload } = useLoad(getMaterials, [] as Material[]);

  const formModal = useItemModal<Material>();
  const purchaseModal = useItemModal<Material>();
  const deleteModal = useItemModal<Material>();
  const { busy: deleteBusy, run } = useAsyncAction();

  const handleSaved = () => {
    formModal.close();
    purchaseModal.close();
    reload();
  };

  const handleDelete = async () => {
    const target = deleteModal.item;
    if (!target) return;
    const ok = await run(() => deleteMaterial(target.id), "Material eliminado");
    if (ok) {
      deleteModal.close();
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Materiales"
        actions={
          <PermissionGate permission="materials:create">
            <Button onClick={() => formModal.open()}>Nuevo material</Button>
          </PermissionGate>
        }
      />

      <DataTable
        rows={materials}
        columns={columns}
        getRowKey={(material) => material.id}
        loading={loading}
        emptyMessage="No hay materiales registrados."
        onEdit={(material) => formModal.open(material)}
        onDelete={(material) => deleteModal.open(material)}
        editPermission="materials:update"
        deletePermission="materials:delete"
        renderActions={(material) => (
          <PermissionGate permission="materials:purchase">
            <Button size="xs" variant="light" onClick={() => purchaseModal.open(material)}>
              Comprar
            </Button>
          </PermissionGate>
        )}
      />

      <MaterialFormModal
        opened={formModal.opened}
        material={formModal.item}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <MaterialPurchaseModal
        opened={purchaseModal.opened}
        material={purchaseModal.item}
        onClose={purchaseModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={deleteModal.opened}
        title="Eliminar material"
        message={
          deleteModal.item
            ? `¿Eliminar ${deleteModal.item.type} ${deleteModal.item.color}? El historial de pedidos que lo usaron se conserva.`
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