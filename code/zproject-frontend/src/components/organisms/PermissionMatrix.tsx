import { Checkbox, Stack, Table, Text } from "@mantine/core";
import type { Permission } from "../../types/auth";
import {
  buildMatrix,
  crudActions,
  getResource,
  permissionLabel,
  resourceLabel,
} from "../../utils/permissions";

interface PermissionMatrixProps {
  permissions: Permission[];
  value: string[];
  onChange: (codes: string[]) => void;
}

export function PermissionMatrix({ permissions, value, onChange }: PermissionMatrixProps) {
  const { resources, extras } = buildMatrix(permissions);
  const available = new Set(permissions.map((permission) => permission.code));
  const selected = new Set(value);

  // Regla: sin "Ver" no hay nada más. Marcar cualquier permiso marca también "Ver"
  // de su módulo, y quitar "Ver" quita todos los permisos de ese módulo.
  const toggle = (code: string, checked: boolean) => {
    const resource = getResource(code);
    const readCode = `${resource}:read`;
    const next = new Set(selected);

    if (checked) {
      next.add(code);
      if (available.has(readCode)) next.add(readCode);
    } else {
      next.delete(code);
      if (code === readCode) {
        for (const other of Array.from(next)) {
          if (getResource(other) === resource) next.delete(other);
        }
      }
    }
    onChange(Array.from(next));
  };

  return (
    <Stack gap="md">
      <Table.ScrollContainer minWidth={420}>
        <Table withTableBorder withColumnBorders verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Módulo</Table.Th>
              {crudActions.map((item) => (
                <Table.Th key={item.action} ta="center">
                  {item.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {resources.map((resource) => (
              <Table.Tr key={resource}>
                <Table.Td>{resourceLabel(resource)}</Table.Td>
                {crudActions.map(({ action, label }) => {
                  const code = `${resource}:${action}`;
                  return (
                    <Table.Td key={action} ta="center">
                      {available.has(code) ? (
                        <Checkbox
                          style={{ display: "inline-flex" }}
                          aria-label={`${label} ${resourceLabel(resource)}`}
                          checked={selected.has(code)}
                          onChange={(event) => toggle(code, event.currentTarget.checked)}
                        />
                      ) : (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {extras.length > 0 && (
        <div>
          <Text size="sm" fw={500} mb="xs">
            Permisos especiales
          </Text>
          <Stack gap={6}>
            {extras.map((permission) => (
              <Checkbox
                key={permission.code}
                label={permissionLabel(permission.code)}
                checked={selected.has(permission.code)}
                onChange={(event) => toggle(permission.code, event.currentTarget.checked)}
              />
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
}