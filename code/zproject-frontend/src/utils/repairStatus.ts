export const repairStatusLabels: Record<string, string> = {
  recibido: "Recibido",
  diagnosticado: "Diagnosticado",
  enReparacion: "En reparación",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const repairStatusColors: Record<string, string> = {
  recibido: "gray",
  diagnosticado: "blue",
  enReparacion: "yellow",
  finalizado: "green",
  cancelado: "red",
};

export const changeableStatusOptions = [
  "recibido",
  "diagnosticado",
  "enReparacion",
  "cancelado",
].map((value) => ({ value, label: repairStatusLabels[value] }));

export const filterStatusOptions = Object.entries(repairStatusLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function getRepairStatusLabel(status: string): string {
  return repairStatusLabels[status] ?? status;
}

export function getRepairStatusColor(status: string): string {
  return repairStatusColors[status] ?? "gray";
}

export function isRepairClosed(status: string): boolean {
  return status === "finalizado" || status === "cancelado";
}
