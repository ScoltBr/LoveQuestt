import { Outlet, Navigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

const AppLayout = () => {
  const { session, loading } = useAuth();
  useRealtimeSync();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-sm font-body">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 animated-mesh -z-10 opacity-50 dark:opacity-30 pointer-events-none" />

      <main className="relative max-w-lg mx-auto min-h-screen flex flex-col" style={{ paddingBottom: "max(env(safe-area-inset-bottom) + 90px, 96px)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex-1 w-full">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );

};

export default AppLayout;
