import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const { session } = useAuth();
    const navigate = useNavigate();

    if (session) {
        return <Navigate to="/app" replace />;
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate("/app");
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                        },
                    },
                });
                if (error) throw error;
                toast.success("Conta criada! Você já pode acessar.");
                navigate("/app");
            }
        } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro na autenticação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-[var(--shadow-card)]">
                <div className="flex flex-col items-center mb-8">
                    <Heart className="w-12 h-12 text-primary fill-primary mb-4" />
                    <h1 className="text-2xl font-extrabold text-foreground font-display">
                        {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
                    </h1>
                    <p className="text-muted-foreground text-sm font-body mt-2">
                        {isLogin ? "Entre para continuar sua jornada" : "Comece sua jornada a dois hoje"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Como você quer ser chamado?</Label>
                            <Input
                                id="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                className="rounded-xl"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="rounded-xl"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-xl mt-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold shadow-[var(--shadow-love)]"
                        disabled={loading}
                    >
                        {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-muted-foreground font-body hover:text-primary transition-colors"
                    >
                        {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
                    </button>
                </div>
            </div>
        </div>
    );
}
