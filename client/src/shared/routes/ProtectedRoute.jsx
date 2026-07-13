import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
