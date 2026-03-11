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
    <div className="min-h-screen bg-background">
      <main className="pb-20 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
