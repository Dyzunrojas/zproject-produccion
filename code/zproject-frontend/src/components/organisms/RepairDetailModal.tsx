import type { ReactNode } from "react";
import { Group, Modal, Stack, Text } from "@mantine/core";
import { StatusBadge } from "../atoms/StatusBadge";
import type { Repair } from "../../types/repair";
import { formatDate, formatMoney } from "../../utils/format";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text>{children}</Text>
    </div>
  );
}

interface RepairDetailModalProps {
  opened: boolean;
  repair: Repair | null;
  onClose: () => void;
}

export function RepairDetailModal({
  opened,
  repair,
  onClose,
}: RepairDetailModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Detalle de la reparación"
      centered
    >
      {repair && (
        <Stack gap="sm">
          <Group>
            <StatusBadge status={repair.status} />
          </Group>
          <DetailRow label="Cliente">{repair.clientName}</DetailRow>
          <DetailRow label="Equipo">
            {repair.device.type} {repair.device.brand} {repair.device.model}
            {repair.device.serialNumber
              ? ` (serie ${repair.device.serialNumber})`
              : ""}
          </DetailRow>
          <DetailRow label="Problema">{repair.problemDescription}</DetailRow>
          <DetailRow label="Diagnóstico">{repair.diagnosis ?? "—"}</DetailRow>
          <DetailRow label="Monto del diagnóstico">
            {formatMoney(repair.diagnosisAmount)}
          </DetailRow>
          <DetailRow label="Trabajo">{repair.workDescription || "—"}</DetailRow>
          <DetailRow label="Monto del trabajo">
            {formatMoney(repair.workAmount)}
          </DetailRow>
          <DetailRow label="Ingreso">{formatDate(repair.createdAt)}</DetailRow>
          <DetailRow label="Entrega estimada">
            {formatDate(repair.estimatedDeliveryDate)}
          </DetailRow>
          <DetailRow label="Entregado">
            {formatDate(repair.deliveryDate)}
          </DetailRow>
          <DetailRow label="Finalización">
            {formatDate(repair.finishedAt)}
          </DetailRow>
          <DetailRow label="Repuestos usados">
            {repair.spareParts.length === 0
              ? "—"
              : repair.spareParts
                  .map(
                    (usage) => `${usage.sparePart.name} x${usage.quantityUsed}`,
                  )
                  .join(", ")}
          </DetailRow>
        </Stack>
      )}
    </Modal>
  );
}
