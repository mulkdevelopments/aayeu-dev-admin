import "./globals.css";
import { ToastProvider } from "@/components/_ui/toast-utils";
import ProtectedRoute from "@/components/comman/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
