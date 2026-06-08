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
            path="/discover"
            element={
              <PlaceholderPage
                eyebrow="Discover"
                title="Discover"
                description="Fresh ideas, seasonal suggestions and curated inspiration can grow into this space next."
              />
            }
          />
          <Route
            path="/recipes"
            element={
              <PlaceholderPage
                eyebrow="Recipes"
                title="Recipes"
                description="This shelf is ready for the actual recipe library, filters and detailed cooking flows."
              />
            }
          />
          <Route
            path="/saved"
            element={
              <PlaceholderPage
                eyebrow="Saved"
                title="Saved"
                description="Bookmarks, personal collections and recently cooked recipes can land here."
              />
            }
          />
          <Route
            path="/profile"
            element={
              <PlaceholderPage
                eyebrow="Profile"
                title="Profile"
                description="Account details, preferences and your cooking history can plug into this calmer personal area."
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
