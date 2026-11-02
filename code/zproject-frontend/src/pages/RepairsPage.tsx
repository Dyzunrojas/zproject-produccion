import { useState } from "react";
import { Button, Group, SegmentedControl, Select } from "@mantine/core";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { StatusBadge } from "../components/atoms/StatusBadge";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { RepairDetailModal } from "../components/organisms/RepairDetailModal";
import { RepairDiagnosisModal } from "../components/organisms/RepairDiagnosisModal";
import { RepairFinalizeModal } from "../components/organisms/RepairFinalizeModal";
import { RepairFormModal } from "../components/organisms/RepairFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { getClients } from "../services/clientService";
import { changeRepairStatus, getRepairs } from "../services/repairService";
import type { Client } from "../types/client";
import type { Repair } from "../types/repair";
import { buildClientOptions } from "../utils/clientOptions";
import { formatDate } from "../utils/format";
import { orderStatusLabels } from "../utils/orderStatus";

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: orderStatusLabels.pending, value: "pending" },
  { label: orderStatusLabels.inProgress, value: "inProgress" },
  { label: orderStatusLabels.finished, value: "finished" },
  { label: orderStatusLabels.cancelled, value: "cancelled" },
];

export function RepairsPage() {
  const {
    data: repairs,
    loading,
    reload,
  } = useLoad(getRepairs, [] as Repair[]);
  const { data: clients } = useLoad(getClients, [] as Client[]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState<string | null>(null);

  const formModal = useItemModal<Repair>();
  const detailModal = useItemModal<Repair>();
  const diagnosisModal = useItemModal<Repair>();
  const finalizeModal = useItemModal<Repair>();
  const cancelModal = useItemModal<Repair>();
  const { busy, run } = useAsyncAction();

  const handleSaved = () => {
    formModal.close();
    diagnosisModal.close();
    finalizeModal.close();
    reload();
  };

  const handleStart = async (repair: Repair) => {
    const ok = await run(
      () => changeRepairStatus(repair.id, "inProgress"),
      `Reparación #${repair.id} en proceso`,
    );

    if (ok) reload();
  };

  const handleCancel = async () => {
    const target = cancelModal.item;
    if (!target) return;

    const ok = await run(
      () => changeRepairStatus(target.id, "cancelled"),
      `Reparación #${target.id} cancelada`,
    );

    if (ok) {
      cancelModal.close();
      reload();
    }
  };

  const visibleRepairs = repairs.filter(
    (repair) =>
      (statusFilter === "all" || repair.status === statusFilter) &&
      (!clientFilter || repair.clientId === Number(clientFilter)),
  );

  const columns: Column<Repair>[] = [
    { header: "#", render: (repair) => repair.id },
    { header: "Cliente", render: (repair) => repair.clientName },
    {
      header: "Equipo",
      render: (repair) =>
        `${repair.device.type} ${repair.device.brand} ${repair.device.model}`,
    },
    {
      header: "Estado",
      render: (repair) => <StatusBadge status={repair.status} />,
    },
    { header: "Ingreso", render: (repair) => formatDate(repair.createdAt) },
    {
      header: "Entrega estimada",
      render: (repair) => formatDate(repair.estimatedDeliveryDate),
    },
    {
      header: "Entregado",
      render: (repair) => formatDate(repair.deliveryDate),
    },
    {
      header: "Acciones",
      render: (repair) => {
        const open =
          repair.status === "pending" || repair.status === "inProgress";

        return (
          <Group gap="xs" wrap="nowrap">
            <Button
              size="xs"
              variant="default"
              onClick={() => detailModal.open(repair)}
            >
              Detalle
            </Button>

            {open && (
              <>
                <PermissionGate permission="repairs:update">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => formModal.open(repair)}
                  >
                    {repair.status === "inProgress"
                      ? repair.workDescription && repair.workAmount !== null
                        ? "Editar trabajo"
                        : "Registrar trabajo"
                      : "Editar registro"}
                  </Button>

                  {repair.status === "pending" && (
                    <>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => diagnosisModal.open(repair)}
                      >
                        Diagnóstico
                      </Button>

                      <Button
                        size="xs"
                        variant="light"
                        disabled={!repair.diagnosis}
                        onClick={() => handleStart(repair)}
                      >
                        Iniciar reparación
                      </Button>
                    </>
                  )}

                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => cancelModal.open(repair)}
                  >
                    Cancelar
                  </Button>
                </PermissionGate>

                <PermissionGate permission="repairs:finalize">
                  {repair.status === "inProgress" && (
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      disabled={
                        !repair.diagnosis ||
                        !repair.workDescription?.trim() ||
                        repair.workAmount === null
                      }
                      onClick={() => finalizeModal.open(repair)}
                    >
                      Finalizar
                    </Button>
                  )}
                </PermissionGate>
              </>
            )}
          </Group>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Reparaciones"
        actions={
          <PermissionGate permission="repairs:create">
            <Button onClick={() => formModal.open()}>Registrar equipo</Button>
          </PermissionGate>
        }
      />

      <Group mb="md">
        <SegmentedControl
          value={statusFilter}
          onChange={(value) => setStatusFilter(String(value))}
          data={filterOptions}
        />

        <Select
          placeholder="Todos los clientes"
          clearable
          searchable
          nothingFoundMessage="No se encontraron clientes"
          data={buildClientOptions(clients)}
          value={clientFilter}
          onChange={(value) =>
            setClientFilter(value === null ? null : String(value))
          }
        />
      </Group>

      <DataTable
        rows={visibleRepairs}
        columns={columns}
        getRowKey={(repair) => repair.id}
        loading={loading}
        emptyMessage="No hay reparaciones para mostrar."
        minWidth={1000}
      />

      <RepairFormModal
        opened={formModal.opened}
        repair={formModal.item}
        clients={clients}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <RepairDetailModal
        opened={detailModal.opened}
        repair={detailModal.item}
        onClose={detailModal.close}
      />

      <RepairDiagnosisModal
        opened={diagnosisModal.opened}
        repair={diagnosisModal.item}
        onClose={diagnosisModal.close}
        onSaved={handleSaved}
      />

      <RepairFinalizeModal
        opened={finalizeModal.opened}
        repair={finalizeModal.item}
        onClose={finalizeModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={cancelModal.opened}
        title="Cancelar reparación"
        message={
          cancelModal.item
            ? `¿Cancelar la reparación #${cancelModal.item.id} de ${cancelModal.item.clientName}? No se podrá modificar después.`
            : ""
        }
        confirmLabel="Cancelar reparación"
        loading={busy}
        onConfirm={handleCancel}
        onCancel={cancelModal.close}
      />
    </>
  );
}
