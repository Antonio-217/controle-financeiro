import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { MainLayout } from "./components/layout/MainLayout";
import logo from "./assets/icon.png";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";

// Componente Splash Screen
function SplashScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 gap-6">
      <div className="relative flex items-center justify-center">

        <div className="absolute inset-0 bg-emerald-500 blur-[50px] opacity-20 rounded-full animate-pulse" />
        <img 
          src={logo} 
          alt="Carregando..." 
          className="w-24 h-24 object-contain animate-pulse relative z-10"
        />
      </div>
      
      <span className="text-zinc-500 text-sm font-medium animate-pulse tracking-wide">
        Carregando seu espaço...
      </span>
    </div>
  );
}

// Componente para proteger rotas privadas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
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

        <Route element={<PrivateRoute> <MainLayout/> </PrivateRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<div>Tela de Relatórios em breve</div>} />
          <Route path="/boxes" element={<div>Tela de Relatórios em breve</div>} />
          <Route path="/settings" element={<Settings />} />
        </Route>

      </Routes>
      <Toaster position="top-center" richColors theme="light" />
    </BrowserRouter>
  );
}

export default App;