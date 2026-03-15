import { Outlet, Navigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

const AppLayout = () => {
  const { session, loading } = useAuth();
  useRealtimeSync();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 animated-mesh -z-10 opacity-50 dark:opacity-30" />
      
      <main className="relative z-10 pb-24 pt-[env(safe-area-inset-top,1rem)] max-w-lg mx-auto min-h-screen flex flex-col">
        <div className="flex-1 w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
