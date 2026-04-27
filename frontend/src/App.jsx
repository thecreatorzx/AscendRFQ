import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { NotificationProvider } from "./context/NotificationContext";
import { PageLoader } from "./components/ui/Spinner";

import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";
import DashboardPage    from "./pages/DashboardPage";
import CreateRFQPage    from "./pages/CreateRFQPage";
import AuctionDetailPage from "./pages/AuctionDetailPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}
function BuyerRoute({ children }) {
  const { user, isBuyer, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isBuyer) return <Navigate to="/" replace />;
  return children;
}
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/"
              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />
            <Route path="/rfqs/new"
              element={<BuyerRoute><CreateRFQPage /></BuyerRoute>}
            />
            <Route path="/rfqs/:id"
              element={<ProtectedRoute><AuctionDetailPage /></ProtectedRoute>}
            />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}