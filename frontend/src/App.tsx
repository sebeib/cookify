import { Navigate, Route, Routes } from "react-router-dom";
import { AppShellLayout } from "./layout/AppShellLayout";
import { RequireAuth } from "./auth/RequireAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShellLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="/users"
            element={
              <PlaceholderPage
                eyebrow="User management"
                title="Users"
                description="The authenticated shell is ready. The actual user management screens can grow here next."
              />
            }
          />
          <Route
            path="/recipes"
            element={
              <PlaceholderPage
                eyebrow="Cookbook"
                title="Recipes"
                description="This area is intentionally empty for now and gives us a clean place to continue with the product."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <PlaceholderPage
                eyebrow="Workspace"
                title="Settings"
                description="Navigation, auth state and layout are already wired. Settings can plug into this shell later."
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
