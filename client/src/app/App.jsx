import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../shared/routes/ProtectedRoute.jsx";
import GuestRoute from "../shared/routes/GuestRoute.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import SignupPage from "../features/auth/pages/SignupPage.jsx";
import ChatPage from "../features/chat/pages/ChatPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
