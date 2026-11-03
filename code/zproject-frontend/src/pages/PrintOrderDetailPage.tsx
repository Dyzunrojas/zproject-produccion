import { useCallback, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, FileButton, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PermissionGate } from "../components/atoms/PermissionGate";
import { StatusBadge } from "../components/atoms/StatusBadge";
import { ConfirmModal } from "../components/molecules/ConfirmModal";
import { PageHeader } from "../components/molecules/PageHeader";
import { DataTable, type Column } from "../components/organisms/DataTable";
import { EditDeliveryDateModal } from "../components/organisms/EditDeliveryDateModal";
import { EditTotalAmountModal } from "../components/organisms/EditTotalAmountModal";
import { FinalizePrintOrderModal } from "../components/organisms/FinalizePrintOrderModal";
import { ObjectFormModal } from "../components/organisms/ObjectFormModal";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useItemModal } from "../hooks/useItemModal";
import { useLoad } from "../hooks/useLoad";
import { getMaterials } from "../services/materialService";
import {
  deleteObject,
  downloadStl,
  getPrintOrder,
  uploadStl,
} from "../services/printOrderService";
import type { Material } from "../types/material";
import type { MaterialUsage, Object3D, PrintOrder } from "../types/printOrder";
import { formatDate, formatGrams, formatMoney } from "../utils/format";
import { notifyWarning } from "../utils/notify";
import { validateStlFile } from "../utils/validators";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={500} component="div">
        {children}
      </Text>
    </div>
  );
}

export function PrintOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();

  const fetchOrder = useCallback(() => getPrintOrder(orderId), [orderId]);
  const { data: order, loading, reload } = useLoad<PrintOrder | null>(fetchOrder, null);
  const { data: materials } = useLoad(getMaterials, [] as Material[]);

  const { busy, run } = useAsyncAction();
  const [dateOpened, dateHandlers] = useDisclosure(false);
  const [amountOpened, amountHandlers] = useDisclosure(false);
  const [objectOpened, objectHandlers] = useDisclosure(false);
  const [finalizeOpened, finalizeHandlers] = useDisclosure(false);
  const deleteModal = useItemModal<Object3D>();

  const goBack = () => navigate("/printOrders");

  if (!loading && !order) {
    return (
      <Stack>
        <Title order={3}>Pedido no encontrado</Title>
        <Button variant="light" w="fit-content" onClick={goBack}>
          Volver a pedidos
        </Button>
      </Stack>
    );
  }

  const editable = order?.status === "pending" || order?.status === "inProgress";

  const closeAndReload = (close: () => void) => () => {
    close();
    reload();
  };

  const handleUpload = async (item: Object3D, file: File) => {
    const problem = validateStlFile(file);
    if (problem) {
      notifyWarning(problem);
      return;
    }
    const ok = await run(() => uploadStl(orderId, item.id, file), `STL de "${item.name}" subido`);
    if (ok) reload();
  };

  const handleDownload = async (item: Object3D) => {
    await run(async () => {
      const blob = await downloadStl(orderId, item.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.name}.stl`;
      link.click();
      URL.revokeObjectURL(url);
    }, "STL descargado");
  };

  const handleDelete = async () => {
    const target = deleteModal.item;
    if (!target) return;
    const ok = await run(() => deleteObject(orderId, target.id), "Objeto eliminado");
    if (ok) {
      deleteModal.close();
      reload();
    }
  };

  const materialName = (materialId: number) => {
    const material = materials.find((item) => item.id === materialId);
    return material ? `${material.type} ${material.color}` : `Material #${materialId}`;
  };

  const objectColumns: Column<Object3D>[] = [
    { header: "Nombre", render: (item) => item.name },
    {
      header: "Descripción",
      render: (item) =>
        item.description ? (
          <Text size="sm">{item.description}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        ),
    },
    {
      header: "Archivo STL",
      render: (item) => (item.stlFilePath ? "Subido" : "Sin archivo"),
    },
    {
      header: "Acciones",
      render: (item) => (
        <Group gap="xs" wrap="nowrap">
          {item.stlFilePath && (
            <Button size="xs" variant="light" onClick={() => handleDownload(item)}>
              Descargar STL
            </Button>
          )}
          {editable && (
            <PermissionGate permission="print_orders:update">
              <FileButton accept=".stl" onChange={(file) => file && handleUpload(item, file)}>
                {(props) => (
                  <Button size="xs" variant="light" {...props}>
                    {item.stlFilePath ? "Reemplazar STL" : "Subir STL"}
                  </Button>
                )}
              </FileButton>
              <Button
                size="xs"
                variant="light"
                color="red"
                disabled={(order?.objects.length ?? 0) <= 1}
                onClick={() => deleteModal.open(item)}
              >
                Quitar
              </Button>
            </PermissionGate>
          )}
        </Group>
      ),
    },
  ];

  const usageColumns: Column<MaterialUsage>[] = [
    { header: "Material", render: (usage) => materialName(usage.materialId) },
    { header: "Gramos usados", render: (usage) => formatGrams(Number(usage.gramsUsed)) },
  ];

  return (
    <>
      <PageHeader
        title={`Pedido #${orderId}`}
        actions={
          <Group>
            <Button variant="default" onClick={goBack}>
              Volver
            </Button>
            {order?.status === "inProgress" && (
              <PermissionGate permission="print_orders:finalize">
                <Button color="green" onClick={finalizeHandlers.open}>
                  Finalizar pedido
                </Button>
              </PermissionGate>
            )}
          </Group>
        }
      />

      {order && (
        <Stack>
          <Paper withBorder p="md">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Info label="Cliente">{order.clientName}</Info>
              <Info label="Estado">
                <StatusBadge status={order.status} />
              </Info>
              <Info label="Entrega estimada">
                <Group gap="xs">
                  {formatDate(order.estimatedDeliveryDate)}
                  {editable && (
                    <PermissionGate permission="print_orders:update">
                      <Button size="compact-xs" variant="subtle" onClick={dateHandlers.open}>
                        Cambiar
                      </Button>
                    </PermissionGate>
                  )}
                </Group>
              </Info>
              <Info label="Entregado">{formatDate(order.deliveryDate)}</Info>
            </SimpleGrid>
          </Paper>

          <Paper withBorder p="md">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Info label="Monto total">
                <Group gap="xs">
                  {formatMoney(order.totalAmount)}
                  {editable && (
                    <PermissionGate permission="print_orders:update">
                      <Button size="compact-xs" variant="subtle" onClick={amountHandlers.open}>
                        Cambiar
                      </Button>
                    </PermissionGate>
                  )}
                </Group>
              </Info>
              <Info label="Abonado">{formatMoney(order.totalPaid)}</Info>
              <Info label="Saldo pendiente">
                <Text fw={700} size="lg" c={order.balance <= 0 && order.totalAmount ? "green.8" : undefined}>
                  {order.totalAmount === null
                    ? "Sin monto definido"
                    : order.balance <= 0
                      ? "Pagado"
                      : formatMoney(order.balance)}
                </Text>
              </Info>
            </SimpleGrid>
          </Paper>

          <Group justify="space-between">
            <Title order={4}>Objetos</Title>
            {editable && (
              <PermissionGate permission="print_orders:update">
                <Button size="xs" onClick={objectHandlers.open}>
                  Agregar objeto
                </Button>
              </PermissionGate>
            )}
          </Group>
          <DataTable
            rows={order.objects}
            columns={objectColumns}
            getRowKey={(item) => item.id}
            loading={loading || busy}
            emptyMessage="Este pedido no tiene objetos."
            minWidth={700}
          />

          {order.materialUsages.length > 0 && (
            <>
              <Title order={4}>Material usado</Title>
              <DataTable
                rows={order.materialUsages}
                columns={usageColumns}
                getRowKey={(usage) => usage.id}
                loading={false}
                emptyMessage=""
                minWidth={400}
              />
            </>
          )}
        </Stack>
      )}

      {order && (
        <>
          <EditDeliveryDateModal
            opened={dateOpened}
            orderId={orderId}
            currentDate={order.estimatedDeliveryDate}
            onClose={dateHandlers.close}
            onSaved={closeAndReload(dateHandlers.close)}
          />
          <EditTotalAmountModal
            opened={amountOpened}
            orderId={orderId}
            currentAmount={order.totalAmount}
            totalPaid={order.totalPaid}
            onClose={amountHandlers.close}
            onSaved={closeAndReload(amountHandlers.close)}
          />
          <ObjectFormModal
            opened={objectOpened}
            orderId={orderId}
            onClose={objectHandlers.close}
            onSaved={closeAndReload(objectHandlers.close)}
          />
          <FinalizePrintOrderModal
            opened={finalizeOpened}
            orderId={orderId}
            onClose={finalizeHandlers.close}
            onSaved={closeAndReload(finalizeHandlers.close)}
          />
        </>
      )}

      <ConfirmModal
        opened={deleteModal.opened}
        title="Quitar objeto"
        message={deleteModal.item ? `¿Quitar "${deleteModal.item.name}" del pedido?` : ""}
        confirmLabel="Quitar"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={deleteModal.close}
      />
    </>
  );
}