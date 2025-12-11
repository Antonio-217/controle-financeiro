import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Investments } from "./pages/Investments";
import { Layout } from "./components/Layout/Layout";

// Componente para proteger rotas privadas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/investments" element={<Investments />} />
        </Route>

      </Routes>
      <Toaster position="top-center" richColors theme="light" />
    </BrowserRouter>
  );
}

export default App;