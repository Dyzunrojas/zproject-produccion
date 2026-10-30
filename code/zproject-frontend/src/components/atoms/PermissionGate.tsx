import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? <>{children}</> : null;
}