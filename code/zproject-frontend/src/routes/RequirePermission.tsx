import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ForbiddenPage } from "../pages/ForbiddenPage";

export function RequirePermission({ permission }: { permission: string }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <ForbiddenPage />;
  }
  return <Outlet />;
}