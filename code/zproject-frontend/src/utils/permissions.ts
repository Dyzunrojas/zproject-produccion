import type { Permission } from "../types/auth";

export const crudActions = [
  { action: "create", label: "Crear" },
  { action: "read", label: "Ver" },
  { action: "update", label: "Editar" },
  { action: "delete", label: "Eliminar" },
] as const;

// Orden en que salen los módulos en la tabla
const resourceLabels: Record<string, string> = {
  clients: "Clientes",
  orders: "Pedidos (general)",
  print_orders: "Pedidos 3D",
  repairs: "Reparaciones",
  warranties: "Garantías",
  payments: "Pagos",
  materials: "Materiales",
  spare_parts: "Repuestos",
  tools: "Herramientas",
};
const resourceOrder = Object.keys(resourceLabels);

const extraLabels: Record<string, string> = {
  "print_orders:finalize": "Finalizar pedidos 3D",
  "repairs:finalize": "Finalizar reparaciones",
  "materials:purchase": "Registrar compras de material",
  "auth:manageUsers": "Administrar usuarios",
  "auth:manageRoles": "Administrar roles y permisos",
};

const crudNames: string[] = crudActions.map((item) => item.action);

export function getResource(code: string): string {
  return code.split(":")[0];
}

export function resourceLabel(resource: string): string {
  return resourceLabels[resource] ?? resource;
}

export function permissionLabel(code: string): string {
  return extraLabels[code] ?? code;
}

// Separa los permisos en: módulos para la tabla (crear/ver/editar/eliminar)
// y permisos especiales (finalizar, comprar, administrar...)
export function buildMatrix(permissions: Permission[]) {
  const resources = new Set<string>();
  const extras: Permission[] = [];

  for (const permission of permissions) {
    const [resource, action] = permission.code.split(":");
    if (crudNames.includes(action)) {
      resources.add(resource);
    } else {
      extras.push(permission);
    }
  }

  const position = (resource: string) => {
    const index = resourceOrder.indexOf(resource);
    return index === -1 ? resourceOrder.length : index;
  };

  return {
    resources: Array.from(resources).sort((a, b) => position(a) - position(b)),
    extras,
  };
}