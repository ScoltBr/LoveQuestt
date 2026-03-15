import { motion } from "framer-motion";
import { Heart, Sparkles, Target, Gift, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Target, title: "Missões Diárias", desc: "Crie hábitos e complete missões juntos" },
  { icon: Sparkles, title: "Ganhe XP", desc: "Cada missão concluída rende pontos de experiência" },
  { icon: TrendingUp, title: "Evolua Juntos", desc: "Suba de nível e desbloqueie conquistas" },
  { icon: Gift, title: "Recompensas", desc: "Resgate prêmios especiais com seu XP" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="w-7 h-7 text-primary fill-primary" />
          <span className="font-display text-xl font-extrabold text-foreground">LoveQuest</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="font-body font-semibold text-muted-foreground">
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <section className="px-5 pt-12 pb-16 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-body font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Gamifique seu relacionamento
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
            Transforme hábitos em{" "}
            <span className="text-primary">conquistas a dois</span>
          </h1>

          <p className="text-lg text-muted-foreground font-body max-w-md mx-auto mb-8">
            Complete missões diárias, ganhe XP, mantenha sequências e fortaleça seu relacionamento — juntos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-base px-8 shadow-[var(--shadow-love)] hover:shadow-lg transition-all"
            >
              Começar Grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-body font-semibold"
            >
              Como funciona
            </Button>
          </div>
        </motion.div>

        {/* Floating hearts */}
        <div className="relative mt-12 px-4">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block w-full max-w-sm"
          >
            <div className="glass rounded-3xl p-6 border-white/30 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold">L</div>
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground text-sm">Bom dia, Luiz ❤️</p>
                  <p className="text-xs text-muted-foreground font-body">Nível 4 · 680 XP</p>
                </div>
                <div className="flex items-center gap-1 text-streak font-display font-bold text-sm">
                  🔥 7
                </div>
              </div>
              <div className="space-y-3">
                {["Beber 2L de água", "Caminhar 20 min", "Ler 20 minutos"].map((m, i) => (
                  <div key={m} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-[10px] ${i < 2 ? "bg-success border-success text-success-foreground" : "border-white/20"}`}>
                      {i < 2 && "✓"}
                    </div>
                    <span className={`text-sm font-body ${i < 2 ? "text-muted-foreground line-through opacity-50" : "text-foreground font-medium"}`}>{m}</span>
                    {i < 2 && <span className="ml-auto text-xs text-xp font-display font-bold animate-pulse">+15 XP</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-10">
          Como o LoveQuest funciona
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass rounded-3xl p-5 text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/20">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-[10px] leading-relaxed text-muted-foreground font-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 max-w-5xl mx-auto text-center">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 sm:p-12">
          <Heart className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse-love" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground font-body mb-6 max-w-sm mx-auto">
            Crie sua conta grátis e convide seu parceiro para a jornada.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/app")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold px-8 shadow-[var(--shadow-love)]"
          >
            Criar Conta Grátis
            <Heart className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-body">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          LoveQuest © 2026
        </div>
      </footer>
    </div>
  );
};

export default Landing;
