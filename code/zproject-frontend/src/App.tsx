import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/templates/AppLayout";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrintOrdersPage } from "./pages/PrintOrdersPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequirePermission } from "./routes/RequirePermission";
import { ToolsPage } from "./pages/ToolsPage";
import { WarrantiesPage } from "./pages/WarrantiesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route element={<RequirePermission permission="print_orders:read" />}>
            <Route path="/printOrders" element={<PrintOrdersPage />} />
          </Route>

          <Route element={<RequirePermission permission="materials:read" />}>
            <Route path="/materials" element={<MaterialsPage />} />
          </Route>

          <Route element={<RequirePermission permission="tools:read" />}>
            <Route path="/tools" element={<ToolsPage />} />
          </Route>

          <Route element={<RequirePermission permission="warranties:read" />}>
            <Route path="/warranties" element={<WarrantiesPage />} />
          </Route>

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;