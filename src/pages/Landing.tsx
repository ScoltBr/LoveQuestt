import { motion } from "framer-motion";
import { Heart, Sparkles, Target, Gift, TrendingUp, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const features = [
  { icon: Target, title: "Missões Diárias", desc: "Crie hábitos e complete missões juntos" },
  { icon: Sparkles, title: "Ganhe XP", desc: "Cada missão concluída rende pontos de experiência" },
  { icon: TrendingUp, title: "Evolua Juntos", desc: "Suba de nível e desbloqueie conquistas" },
  { icon: Gift, title: "Recompensas", desc: "Resgate prêmios especiais com seu XP" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 animated-mesh opacity-60 dark:opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-love flex items-center justify-center shadow-lg shadow-primary/20">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="font-display text-2xl font-extrabold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">LoveQuest</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="font-body font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
            Entrar
          </Button>
        </header>

      {/* Hero */}
      <section className="px-5 pt-16 pb-20 max-w-5xl mx-auto text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full text-sm font-body font-bold text-primary mb-8 shadow-sm"
          >
            <Sparkles className="w-4 h-4 animate-pulse-love text-primary" />
            A revolução da gamificação para casais
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
            Transforme hábitos em{" "}
            <span className="bg-gradient-to-r from-primary via-love to-streak bg-clip-text text-transparent drop-shadow-sm">conquistas a dois</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground font-body max-w-2xl mx-auto mb-10 leading-relaxed">
            Complete missões diárias, ganhe XP, mantenha sequências perfeitas e fortaleça seu relacionamento de forma divertida e unida.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-lg h-14 px-10 rounded-2xl shadow-[var(--shadow-love)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Começar a Jornada Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-body font-bold text-lg h-14 px-8 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300 glass hover:-translate-y-1"
            >
              Como Funciona
            </Button>
          </div>
        </motion.div>

        {/* Floating preview card */}
        <div className="relative mt-16 px-4 pb-4">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block w-full max-w-md mx-auto relative group"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-streak/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500 -z-10"></div>
            
            <div className="glass-morphism rounded-3xl p-6 sm:p-8 text-left border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 group-hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.15)] group-hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-black text-xl shadow-inner">
                  L
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground text-sm sm:text-base flex items-center gap-1">Bom dia, Luiz <Heart className="w-4 h-4 text-love fill-love inline animate-pulse-love" /></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Nível 4</span>
                    <span className="text-xs text-muted-foreground font-body font-medium">680 XP</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-streak/10 border border-streak/20 rounded-xl px-3 py-1.5 min-w-[3rem]">
                  <span className="text-streak font-display font-black text-sm">🔥 7</span>
                  <span className="text-[9px] text-streak/80 uppercase tracking-wider font-bold">Dias</span>
                </div>
              </div>
              <div className="space-y-3">
                {["Beber 2L de água", "Caminhar 20 min", "Ler 20 minutos", "Elogiar o parceiro(a)"].map((m, i) => (
                  <motion.div 
                    key={m} 
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 transition-colors border border-transparent hover:border-white/30 dark:hover:border-white/10"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[12px] shadow-sm ${i < 2 ? "bg-success border-success text-success-foreground" : "border-muted-foreground/30 dark:border-white/20"}`}>
                      {i < 2 && "✓"}
                    </div>
                    <span className={`text-sm font-body ${i < 2 ? "text-muted-foreground line-through opacity-60" : "text-foreground font-semibold"}`}>{m}</span>
                    <span className={`ml-auto text-xs font-display font-bold ${i < 2 ? "text-success" : "text-xp bg-xp/10 px-2 py-1 rounded-lg"}`}>
                      {i < 2 ? "+15 XP" : "15 XP"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-24 max-w-6xl mx-auto relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            Tudo para seu <span className="text-primary">relacionamento</span>
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Ferramentas desenhadas para aproximar vocês, criar bons hábitos e tornar a rotina uma grande aventura.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="glass rounded-[2rem] p-8 text-center flex flex-col items-center group relative overflow-hidden"
            >
              {/* Subtle hover background bloom */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/20">
                <f.icon className="w-8 h-8 text-primary group-hover:text-love transition-colors" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-3 relative z-10">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground font-body relative z-10">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="px-5 py-24 bg-primary/5 relative z-20 border-y border-white/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">A jornada do casal</h2>
            <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">Quatro passos simples para transformar a rotina em conquistas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connection Line (Desktop only) */}
            <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/30 to-streak/10 -z-10"></div>
            
            {[ 
              { step: 1, title: "Convide", desc: "Crie a conta e envie o link para parear com seu amor." },
              { step: 2, title: "Defina Missões", desc: "Criem hábitos diários para fazerem sozinhos ou juntos." },
              { step: 3, title: "Ganhe XP", desc: "Confirme a conclusão das atividades para subir de nível e ganhar moedas." },
              { step: 4, title: "Resgate Prêmios", desc: "Troquem seus pontos por recompensas combinadas (ex: Jantar, Massagem)." }
            ].map((s, i) => (
              <motion.div key={s.step} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:"-50px"}} transition={{delay: i*0.1, duration: 0.5}} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-love text-white flex items-center justify-center text-3xl font-display font-black mx-auto mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300 ring-4 ring-background">{s.step}</div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed px-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-24 max-w-6xl mx-auto relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Histórias de Sucesso</h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">O que dizem os casais que já subiram de nível com o LoveQuest.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Ana & Carlos", level: "Nível 12", review: "Nossa comunicação melhorou 100%. A gamificação nos mantém focados todos os dias!" },
            { name: "Mari & João", level: "Nível 8", review: "As recompensas salvaram nossos finais de semana. Passamos a ter encontros muito mais divertidos." },
            { name: "Bia & Pedro", level: "Nível 15", review: "Nunca imaginei que beber água e arrumar a cama juntos seria tão saudável e engajador." }
          ].map((t, i) => (
            <motion.div key={i} initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true, margin:"-50px"}} transition={{delay: i*0.1, duration: 0.5}} className="glass-morphism rounded-[2.5rem] p-8 relative flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300">
              <div>
                <Star className="w-8 h-8 text-warning fill-warning mb-6 opacity-80" />
                <p className="text-foreground/90 font-medium mb-8 leading-relaxed italic text-lg opacity-90">"{t.review}"</p>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-streak/20 flex items-center justify-center text-primary font-display font-black text-xl border border-primary/20 shadow-inner">{t.name[0]}</div>
                <div>
                  <p className="font-display font-bold text-base text-foreground">{t.name}</p>
                  <p className="text-xs text-primary font-bold bg-primary/10 inline-block px-2 py-0.5 rounded-full mt-1 bg-white/40 dark:bg-black/20 backdrop-blur-md">{t.level}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-24 max-w-3xl mx-auto relative z-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Perguntas Frequentes</h2>
          <p className="text-muted-foreground font-body text-lg">Tudo o que você precisa saber.</p>
        </div>
        <Accordion type="single" collapsible className="w-full glass-morphism rounded-[2.5rem] p-6 sm:p-10">
          {[
            { q: "O LoveQuest é gratuito?", a: "Sim, todas as funções principais de missões, evolução e pareamento de casal são totalmente gratuitas." },
            { q: "Como convido meu parceiro(a)?", a: "Basta criar sua conta, ir nas configurações e gerar um código de pareamento para compartilhar." },
            { q: "Quais tipos de recompensas posso criar?", a: "Você decide! Desde 'Escolher o filme do fim de semana' até 'Uma massagem nas costas' ou algo mais ousado." },
            { q: "Posso acessar pelo celular?", a: "Claro! O LoveQuest é otimizado para celulares. Você inclusive pode instalar via navegador para abrir direto da tela inicial." }
          ].map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10 dark:border-white/5 last:border-0 py-2">
              <AccordionTrigger className="font-display font-bold text-lg text-left hover:text-primary transition-colors data-[state=open]:text-primary">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-body text-base leading-relaxed pt-2 pb-6">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="px-5 py-24 max-w-4xl mx-auto text-center relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-primary/10 via-background to-love/5 border border-primary/20 rounded-[3rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl shadow-primary/5"
        >
          {/* Decorator blobs */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-love/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
              <Heart className="w-10 h-10 text-primary animate-pulse-love" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Pronto para evoluir a dois?
            </h2>
            <p className="text-muted-foreground font-body text-lg mb-10 max-w-lg mx-auto">
              Junte-se a casais que estão fortalecendo seus laços construindo rotinas incríveis lado a lado.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-lg h-16 px-12 rounded-full shadow-[var(--shadow-love)] hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Criar Conta Grátis Hoje
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 text-center relative z-20">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-body">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          LoveQuest © 2026
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Landing;
