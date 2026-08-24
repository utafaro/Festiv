import { BrowserRouter, Routes, Route } from "react-router";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import FriendsPage from "../pages/FriendsPage";
import ProtectedRoute from "./ProtectedRoute";
import OAuthCallback from "../pages/OAuthCallback";
import FestivalDetailPage from "../pages/FestivalDetailPage";
import LineupDetailPage from "../pages/LineupDetailPage";
import SuiviDetailPage from "../pages/SuiviDetailPage";
import AppLayout from "../layouts/AppLayout";
import LineupPlanningSection from "../components/lineup/LineupPlanningSection";
import SuiviPlanningSection from "../components/suivi/SuiviPlanningSection";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="lineups" element={<LineupPlanningSection />} />
          <Route path="amis" element={<FriendsPage />} />
          <Route path="suivis" element={<SuiviPlanningSection />} />
        </Route>

        {/* Pages avec leur propre en-tête et mise en page pleine largeur : pas d'AppLayout ici,
            sinon le header/sidebar de l'app se superpose au leur (double marges). */}
        <Route
          path="/festival/:id"
          element={
            <ProtectedRoute>
              <FestivalDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lineups/:id"
          element={
            <ProtectedRoute>
              <LineupDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suivis/:id"
          element={
            <ProtectedRoute>
              <SuiviDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
