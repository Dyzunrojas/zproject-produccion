import type { ReactNode } from "react";
import { Button, Center, Group, Loader, Table, Text } from "@mantine/core";
import { PermissionGate } from "../atoms/PermissionGate";

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
  // Acciones opcionales (estilo SIGO): la tabla dibuja los botones
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  editPermission?: string;
  deletePermission?: string;
  // Botones especiales extra (Comprar, Iniciar, etc.), se dibujan antes de Editar/Eliminar
  renderActions?: (row: T) => ReactNode;
}

function Gate({ permission, children }: { permission?: string; children: ReactNode }) {
  return permission ? <PermissionGate permission={permission}>{children}</PermissionGate> : <>{children}</>;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading = false,
  emptyMessage = "No hay datos para mostrar.",
  minWidth,
  onEdit,
  onDelete,
  editPermission,
  deletePermission,
  renderActions,
}: DataTableProps<T>) {
  const hasActions = Boolean(onEdit || onDelete || renderActions);

  if (loading && rows.length === 0) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (rows.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={minWidth ?? 500}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.header}>{column.header}</Table.Th>
            ))}
            {hasActions && <Table.Th>Acciones</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={getRowKey(row)}>
              {columns.map((column) => (
                <Table.Td key={column.header}>{column.render(row)}</Table.Td>
              ))}
              {hasActions && (
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {renderActions?.(row)}
                    {onEdit && (
                      <Gate permission={editPermission}>
                        <Button size="xs" variant="light" onClick={() => onEdit(row)}>
                          Editar
                        </Button>
                      </Gate>
                    )}
                    {onDelete && (
                      <Gate permission={deletePermission}>
                        <Button size="xs" variant="light" color="red" onClick={() => onDelete(row)}>
                          Eliminar
                        </Button>
                      </Gate>
                    )}
                  </Group>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}