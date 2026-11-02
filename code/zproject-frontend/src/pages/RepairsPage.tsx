import { useState } from "react";
import { Badge, Button, Group, Select } from "@mantine/core";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { RepairDetailModal } from "../components/organisms/RepairDetailModal";
import { RepairDiagnosisModal } from "../components/organisms/RepairDiagnosisModal";
import { RepairFinalizeModal } from "../components/organisms/RepairFinalizeModal";
import { RepairFormModal } from "../components/organisms/RepairFormModal";
import { RepairStatusModal } from "../components/organisms/RepairStatusModal";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { getClients } from "../services/clientService";
import { getRepairs } from "../services/repairService";
import type { Client } from "../types/client";
import type { Repair } from "../types/repair";
import { buildClientOptions } from "../utils/clientOptions";
import { formatDate } from "../utils/format";
import {
  filterStatusOptions,
  getRepairStatusColor,
  getRepairStatusLabel,
  isRepairClosed,
} from "../utils/repairStatus";

export function RepairsPage() {
  const {
    data: repairs,
    loading,
    reload,
  } = useLoad(getRepairs, [] as Repair[]);
  const { data: clients } = useLoad(getClients, [] as Client[]);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);

  const formModal = useItemModal<Repair>();
  const detailModal = useItemModal<Repair>();
  const diagnosisModal = useItemModal<Repair>();
  const statusModal = useItemModal<Repair>();
  const finalizeModal = useItemModal<Repair>();

  const clientName = (clientId: number) =>
    clients.find((client) => client.id === clientId)?.name ??
    `Cliente #${clientId}`;

  const handleSaved = () => {
    formModal.close();
    diagnosisModal.close();
    statusModal.close();
    finalizeModal.close();
    reload();
  };

  const visibleRepairs = repairs.filter(
    (repair) =>
      (!statusFilter || repair.status === statusFilter) &&
      (!clientFilter || repair.clientId === Number(clientFilter)),
  );

  const columns: Column<Repair>[] = [
    { header: "N.º", render: (repair) => repair.id },
    { header: "Cliente", render: (repair) => clientName(repair.clientId) },
    {
      header: "Equipo",
      render: (repair) =>
        `${repair.device.type} ${repair.device.brand} ${repair.device.model}`,
    },
    {
      header: "Estado",
      render: (repair) => (
        <Badge color={getRepairStatusColor(repair.status)}>
          {getRepairStatusLabel(repair.status)}
        </Badge>
      ),
    },
    { header: "Ingreso", render: (repair) => formatDate(repair.createdAt) },
    {
      header: "Entrega estimada",
      render: (repair) => formatDate(repair.estimatedDeliveryDate),
    },
    {
      header: "Acciones",
      render: (repair) => (
        <Group gap="xs">
          <Button
            size="xs"
            variant="default"
            onClick={() => detailModal.open(repair)}
          >
            Detalle
          </Button>
          {!isRepairClosed(repair.status) && (
            <>
              <PermissionGate permission="repairs:update">
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => formModal.open(repair)}
                >
                  Editar
                </Button>
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
                  onClick={() => statusModal.open(repair)}
                >
                  Estado
                </Button>
              </PermissionGate>
              <PermissionGate permission="repairs:finalize">
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  disabled={!repair.diagnosis}
                  onClick={() => finalizeModal.open(repair)}
                >
                  Finalizar
                </Button>
              </PermissionGate>
            </>
          )}
        </Group>
      ),
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
        <Select
          placeholder="Todos los estados"
          clearable
          data={filterStatusOptions}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value === null ? null : String(value))
          }
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
        emptyMessage="No hay reparaciones registradas."
        minWidth={900}
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
        clientName={
          detailModal.item ? clientName(detailModal.item.clientId) : ""
        }
        onClose={detailModal.close}
      />

      <RepairDiagnosisModal
        opened={diagnosisModal.opened}
        repair={diagnosisModal.item}
        onClose={diagnosisModal.close}
        onSaved={handleSaved}
      />

      <RepairStatusModal
        opened={statusModal.opened}
        repair={statusModal.item}
        onClose={statusModal.close}
        onSaved={handleSaved}
      />

      <RepairFinalizeModal
        opened={finalizeModal.opened}
        repair={finalizeModal.item}
        onClose={finalizeModal.close}
        onSaved={handleSaved}
      />
    </>
  );
}
