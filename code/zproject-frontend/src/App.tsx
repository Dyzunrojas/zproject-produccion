import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/templates/AppLayout";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrintOrderDetailPage } from "./pages/PrintOrderDetailPage";
import { PrintOrdersPage } from "./pages/PrintOrdersPage";
import { RepairsPage } from "./pages/RepairsPage";
import { RolesPage } from "./pages/RolesPage";
import { SparePartsPage } from "./pages/SparePartsPage";
import { ToolsPage } from "./pages/ToolsPage";
import { UsersPage } from "./pages/UsersPage";
import { WarrantiesPage } from "./pages/WarrantiesPage";
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

          <Route element={<RequirePermission permission="tools:read" />}>
            <Route path="/tools" element={<ToolsPage />} />
          </Route>

          <Route element={<RequirePermission permission="warranties:read" />}>
            <Route path="/warranties" element={<WarrantiesPage />} />
          </Route>

          <Route element={<RequirePermission permission="spare_parts:read" />}>
            <Route path="/spareParts" element={<SparePartsPage />} />
          </Route>

          <Route element={<RequirePermission permission="repairs:read" />}>
            <Route path="/repairs" element={<RepairsPage />} />
          </Route>

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;