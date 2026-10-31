export interface NavItem {
  label: string;
  path: string;
  permission?: string; // si no tiene, lo ve cualquier usuario logueado
}

export const navItems: NavItem[] = [
  { label: "Inicio", path: "/" },
  { label: "Pedidos 3D", path: "/printOrders", permission: "print_orders:read" },
  { label: "Materiales", path: "/materials", permission: "materials:read" },
  { label: "Usuarios", path: "/users", permission: "auth:manageUsers" },
  { label: "Roles", path: "/roles", permission: "auth:manageRoles" },
];