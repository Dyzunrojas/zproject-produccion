import type { ReactNode } from "react";
import { Center, Loader, Table, Text } from "@mantine/core";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  minWidth?: number;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading = false,
  emptyMessage = "No hay registros.",
  minWidth = 600,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (rows.length === 0) {
    return <Text c="dimmed">{emptyMessage}</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.header}>{column.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={getRowKey(row)}>
              {columns.map((column) => (
                <Table.Td key={column.header}>{column.render(row)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}