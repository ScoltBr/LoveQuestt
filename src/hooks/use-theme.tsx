import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "auto";

export interface AccentColor {
  name: string;
  primary: string;
  ring: string;
  love: string;
  shadowLove: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: "Rosa", primary: "347 100% 65%", ring: "347 100% 65%", love: "352 100% 71%", shadowLove: "0 4px 14px -3px hsl(347 100% 65% / 0.35)" },
  { name: "Roxo", primary: "258 90% 66%", ring: "258 90% 66%", love: "280 80% 65%", shadowLove: "0 4px 14px -3px hsl(258 90% 66% / 0.35)" },
  { name: "Laranja", primary: "25 95% 53%", ring: "25 95% 53%", love: "350 90% 65%", shadowLove: "0 4px 14px -3px hsl(25 95% 53% / 0.35)" },
  { name: "Verde", primary: "142 71% 45%", ring: "142 71% 45%", love: "160 70% 50%", shadowLove: "0 4px 14px -3px hsl(142 71% 45% / 0.35)" },
  { name: "Azul", primary: "217 91% 60%", ring: "217 91% 60%", love: "230 80% 65%", shadowLove: "0 4px 14px -3px hsl(217 91% 60% / 0.35)" },
];

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
  accent: string;
  setAccent: (name: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "auto", setTheme: () => {}, resolved: "light",
  accent: "Rosa", setAccent: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyAccent(name: string) {
  const color = ACCENT_COLORS.find((c) => c.name === name) ?? ACCENT_COLORS[0];
  const root = document.documentElement;
  root.style.setProperty("--primary", color.primary);
  root.style.setProperty("--ring", color.ring);
  root.style.setProperty("--shadow-love", color.shadowLove);
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("lovequest-theme") as Theme | null;
    return stored ?? "auto";
  });

  const [accent, setAccentState] = useState<string>(() => {
    return localStorage.getItem("lovequest-accent") ?? "Rosa";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("lovequest-theme", t);
  };

  const setAccent = (name: string) => {
    setAccentState(name);
    localStorage.setItem("lovequest-accent", name);
    applyAccent(name);
  };

  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved: "light" | "dark" =
    theme === "auto" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  // Apply accent on mount
  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};
