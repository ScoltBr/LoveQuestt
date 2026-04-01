import { Home, Target, Gift, BarChart3, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useVibration } from "@/hooks/useVibration";

const tabs = [
  { path: "/app",             icon: Home,     label: "Home"        },
  { path: "/app/missoes",     icon: Target,   label: "Missões"     },
  { path: "/app/recompensas", icon: Gift,     label: "Recompensas" },
  { path: "/app/stats",       icon: BarChart3,label: "Stats"       },
  { path: "/app/perfil",      icon: User,     label: "Perfil"      },
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
    /* Floating pill container — fixed above safe-area, centered, pill-shaped */
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <nav
        className="flex items-center justify-around gap-1 px-3 py-2 rounded-[28px] border shadow-2xl"
        style={{
          background: "hsl(var(--background)/0.75)",
          backdropFilter: "blur(32px) saturate(1.5)",
          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
          borderColor: "hsl(var(--border)/0.5)",
          boxShadow:
            "0 20px 60px -8px rgba(0,0,0,0.4), 0 0 0 1px hsl(var(--border)/0.3), inset 0 1px 0 hsl(255 100% 100% / 0.07)",
          width: "min(340px, calc(100vw - 32px))",
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <motion.button
              key={tab.path}
              onClick={() => handleNav(tab.path)}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="relative flex flex-col items-center justify-center rounded-[20px] transition-all"
              style={{ flex: 1, padding: "8px 4px 6px" }}
            >
              {/* Sliding pill background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      background: "hsl(var(--primary)/0.12)",
                      boxShadow: "0 0 16px hsl(var(--primary)/0.18)",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with glow when active */}
              <div className="relative z-10 mb-0.5">
                <tab.icon
                  style={{
                    width: 22,
                    height: 22,
                    transition: "color 0.2s, filter 0.2s",
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    filter: isActive
                      ? "drop-shadow(0 0 6px hsl(var(--primary)/0.7))"
                      : "none",
                    opacity: isActive ? 1 : 0.65,
                  }}
                />
              </div>

              {/* Label — only show on active tab with a fade */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 font-display font-black uppercase tracking-widest"
                    style={{
                      fontSize: 8,
                      color: "hsl(var(--primary))",
                      lineHeight: 1,
                    }}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Invisible spacer to prevent layout shift when label hides */}
              {!isActive && <div style={{ height: 10 }} />}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
