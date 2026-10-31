export function formatGrams(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// "2026-11-05" (o una fecha con hora) -> "05/11/2026"
export function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatMoney(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return value.toLocaleString("es-CR", { style: "currency", currency: "CRC" });
}
