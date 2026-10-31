import { Button, Group, NumberInput, TextInput } from "@mantine/core";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { WarrantyFormModal } from "../components/organisms/WarrantyFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAuth } from "../hooks/useAuth";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import {
  deleteWarranty,
  getRepairs,
  getWarranties,
} from "../services/warrantyService";
import type { RepairOption, Warranty } from "../types/warranty";
import { notifyError, notifySuccess } from "../utils/notify";

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function WarrantiesPage() {
  const { hasPermission } = useAuth();
  const canReadRepairs = hasPermission("repairs:read");

  const [repairOrderId, setRepairOrderId] = useState<number | string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetcher = useCallback(
    () =>
      getWarranties({
        repairOrderId: repairOrderId === "" ? undefined : Number(repairOrderId),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }),
    [repairOrderId, fromDate, toDate],
  );
  const { data: warranties, loading, reload } = useLoad(fetcher, [] as Warranty[]);

  const repairsFetcher = useCallback(
    () => (canReadRepairs ? getRepairs() : Promise.resolve([] as RepairOption[])),
    [canReadRepairs],
  );
  const { data: repairs } = useLoad(repairsFetcher, [] as RepairOption[]);

  const repairLabels = useMemo(() => {
    const map = new Map<number, string>();
    repairs.forEach((repair) =>
      map.set(repair.id, `${repair.device.brand} ${repair.device.model}`),
    );
    return map;
  }, [repairs]);

  const formModal = useItemModal<Warranty>();
  const deleteModal = useItemModal<Warranty>();
  const { busy: deleteBusy, run } = useAsyncAction();

  const hasFilters = repairOrderId !== "" || fromDate !== "" || toDate !== "";

  const handleSaved = () => {
    formModal.close();
    reload();
  };

  const handleDelete = async () => {
    const target = deleteModal.item;
    if (!target) return;

    const ok = await run(async () => {
      try {
        await deleteWarranty(target.id);
        notifySuccess("Garantía eliminada");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          notifyError(error);
          return;
        }
        throw error;
      }
    });
    if (ok) {
      deleteModal.close();
      reload();
    }
  };

  const columns: Column<Warranty>[] = [
    {
      header: "Reparación",
      render: (warranty) => {
        const label = repairLabels.get(warranty.repairOrderId);
        return label
          ? `#${warranty.repairOrderId} · ${label}`
          : `#${warranty.repairOrderId}`;
      },
    },
    { header: "Inicio", render: (warranty) => formatDate(warranty.startDate) },
    {
      header: "Expiración",
      render: (warranty) => formatDate(warranty.expirationDate),
    },
    { header: "Condiciones", render: (warranty) => warranty.conditions },
    {
      header: "Acciones",
      render: (warranty) => (
        <Group gap="xs">
          <PermissionGate permission="warranties:update">
            <Button
              size="xs"
              variant="default"
              onClick={() => formModal.open(warranty)}
            >
              Editar
            </Button>
          </PermissionGate>
          <PermissionGate permission="warranties:delete">
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => deleteModal.open(warranty)}
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
        title="Garantías"
        actions={
          <PermissionGate permission="warranties:create">
            <Button onClick={() => formModal.open()}>Nueva garantía</Button>
          </PermissionGate>
        }
      />

      <Group mb="md" align="flex-end" gap="sm">
        <NumberInput
          label="Reparación"
          placeholder="N.º de reparación"
          min={1}
          allowDecimal={false}
          w={180}
          value={repairOrderId}
          onChange={(value) =>
            setRepairOrderId(typeof value === "bigint" ? Number(value) : value)
          }
        />
        <TextInput
          label="Desde"
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.currentTarget.value)}
        />
        <TextInput
          label="Hasta"
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.currentTarget.value)}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            onClick={() => {
              setRepairOrderId("");
              setFromDate("");
              setToDate("");
            }}
          >
            Limpiar
          </Button>
        )}
      </Group>

      <DataTable
        rows={warranties}
        columns={columns}
        getRowKey={(warranty) => warranty.id}
        loading={loading}
        emptyMessage={
          hasFilters
            ? "Ninguna garantía cumple el criterio."
            : "No hay garantías registradas."
        }
      />

      <WarrantyFormModal
        opened={formModal.opened}
        warranty={formModal.item}
        onClose={formModal.close}
        onSaved={handleSaved}
      />

      <ConfirmModal
        opened={deleteModal.opened}
        title="Eliminar garantía"
        message={
          deleteModal.item
            ? `¿Eliminar la garantía de la reparación #${deleteModal.item.repairOrderId}?`
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
