import { Navigate, Route, Routes } from "react-router-dom";
import { AppShellLayout } from "./layout/AppShellLayout";
import { RequireAuth } from "./auth/RequireAuth";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditRecipePage } from "./pages/EditRecipePage";
import { InviteRegistrationPage } from "./pages/InviteRegistrationPage";
import { LoginPage } from "./pages/LoginPage";
import { NewRecipePage } from "./pages/NewRecipePage";
import { ProfilePage } from "./pages/ProfilePage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipesPage } from "./pages/RecipesPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InviteRegistrationPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShellLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<NewRecipePage />} />
          <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
