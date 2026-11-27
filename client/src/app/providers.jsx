import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/context/AuthContext.jsx";
import { ThemeProvider } from "../shared/theme/ThemeContext.jsx";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
