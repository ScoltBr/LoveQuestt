import { Home, Target, Gift, BarChart3, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVibration } from "@/hooks/useVibration";

const tabs = [
  { path: "/app", icon: Home, label: "Home" },
  { path: "/app/missoes", icon: Target, label: "Missões" },
  { path: "/app/recompensas", icon: Gift, label: "Recompensas" },
  { path: "/app/stats", icon: BarChart3, label: "Estatísticas" },
  { path: "/app/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { light: vibrateLight } = useVibration();

  const handleNav = (path: string) => {
    vibrateLight();
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 !bg-opacity-80">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNav(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 rounded-xl shadow-lg shadow-primary/10"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground opacity-70"
                }`}
              />
              <span
                className={`text-[9px] font-body font-bold relative z-10 transition-colors uppercase tracking-wider ${
                  isActive ? "text-primary" : "text-muted-foreground opacity-70"
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
