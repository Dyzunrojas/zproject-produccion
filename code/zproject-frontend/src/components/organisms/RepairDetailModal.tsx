import type { ReactNode } from "react";
import { Badge, Group, Modal, Stack, Text } from "@mantine/core";
import type { Repair } from "../../types/repair";
import { formatDate, formatMoney } from "../../utils/format";
import {
  getRepairStatusColor,
  getRepairStatusLabel,
} from "../../utils/repairStatus";

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
  clientName: string;
  onClose: () => void;
}

export function RepairDetailModal({
  opened,
  repair,
  clientName,
  onClose,
}: RepairDetailModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={repair ? `Reparación #${repair.id}` : "Reparación"}
      centered
    >
      {repair && (
        <Stack gap="sm">
          <Group>
            <Badge color={getRepairStatusColor(repair.status)}>
              {getRepairStatusLabel(repair.status)}
            </Badge>
          </Group>
          <DetailRow label="Cliente">{clientName}</DetailRow>
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
