import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/templates/AppLayout";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrintOrderDetailPage } from "./pages/PrintOrderDetailPage";
import { PrintOrdersPage } from "./pages/PrintOrdersPage";
import { RolesPage } from "./pages/RolesPage";
import { UsersPage } from "./pages/UsersPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequirePermission } from "./routes/RequirePermission";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route element={<RequirePermission permission="print_orders:read" />}>
            <Route path="/printOrders" element={<PrintOrdersPage />} />
            <Route path="/printOrders/:id" element={<PrintOrderDetailPage />} />
          </Route>

          <Route element={<RequirePermission permission="materials:read" />}>
            <Route path="/materials" element={<MaterialsPage />} />
          </Route>

          <Route element={<RequirePermission permission="auth:manageUsers" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route element={<RequirePermission permission="auth:manageRoles" />}>
            <Route path="/roles" element={<RolesPage />} />
          </Route>

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;