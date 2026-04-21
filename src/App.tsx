import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/use-theme";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";
import Rewards from "./pages/Rewards";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";

// ─── QueryClient com defaults sensatos ───────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minuto: evita refetch em cada troca de aba
      gcTime:    1000 * 60 * 5,  // 5 minutos: mantém cache na memória
      retry:     2,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── ErrorBoundary global ─────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-background">
          <div className="text-5xl">💔</div>
          <h1 className="text-xl font-display font-black text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            {this.state.error?.message || "Ocorreu um erro inesperado. Por favor, recarregue o app."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/app"; }}
            className="px-6 py-2.5 bg-primary text-white rounded-2xl font-display font-black text-sm mt-2"
          >
            Recarregar App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="missoes" element={<Missions />} />
                  <Route path="recompensas" element={<Rewards />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="perfil" element={<Profile />} />
                  <Route path="configuracoes" element={<Settings />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
