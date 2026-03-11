import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Copy, Users } from "lucide-react";
import { toast } from "sonner";

export default function JoinCouple({ onJoined }: { onJoined: () => void }) {
    const { session } = useAuth();
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);

    const generateCode = async () => {
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: couple, error: coupleError } = await supabase
                .from("couples")
                .insert({
                    partner1_id: session!.user.id,
                    invite_code: code
                })
                .select()
                .single();

            if (coupleError) throw coupleError;

            const { error: profileError } = await supabase
                .from("profiles")
                .update({ couple_id: couple.id })
                .eq("id", session!.user.id);

            if (profileError) throw profileError;

            toast.success("Código gerado! Aguardando parceiro...");
            onJoined();
        } catch (error: any) {
            toast.error(error.message || "Erro ao gerar bloco");
        } finally {
            setLoading(false);
        }
    };

    const joinCouple = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode) return;
        setLoading(true);

        try {
            // Find couple by code
            const formattedCode = inviteCode.trim().toUpperCase();
            
            const { data: couple, error: findError } = await supabase
                .from("couples")
                .select("*")
                .eq("invite_code", formattedCode)
                .single();

            if (findError || !couple) {
                throw new Error("Código inválido ou não encontrado.");
            }

            if (couple.partner2_id) {
                throw new Error("Este casal já está completo.");
            }

            // Update couple
            const { error: coupleUpdateError } = await supabase
                .from("couples")
                .update({ partner2_id: session!.user.id })
                .eq("id", couple.id);

            if (coupleUpdateError) throw coupleUpdateError;

            // Update profile
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ couple_id: couple.id })
                .eq("id", session!.user.id);

            if (profileError) throw profileError;

            toast.success("Conectado com sucesso!");
            onJoined();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-8 h-full min-h-[60vh]">
            <div className="space-y-2">
                <Heart className="w-16 h-16 text-primary fill-primary mx-auto mb-4" />
                <h2 className="text-3xl font-display font-extrabold text-foreground">Conecte-se</h2>
                <p className="text-muted-foreground font-body max-w-sm">
                    LoveQuest é melhor a dois. Crie um novo casal ou entre com um código de convite.
                </p>
            </div>

            <div className="w-full max-w-sm space-y-4 bg-card border border-border p-6 rounded-3xl shadow-[var(--shadow-card)]">
                <form onSubmit={joinCouple} className="space-y-3">
                    <Input
                        placeholder="Digite o código de convite..."
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="text-center font-mono rounded-xl tracking-widest"
                        maxLength={6}
                    />
                    <Button type="submit" variant="secondary" className="w-full font-bold" disabled={loading || inviteCode.length < 3}>
                        <Users className="w-4 h-4 mr-2" />
                        Entrar no Casal
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-body">ou</span>
                    </div>
                </div>

                <Button onClick={generateCode} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-display shadow-[var(--shadow-love)]">
                    <Heart className="w-4 h-4 mr-2" />
                    Meu parceiro ainda não tem um código
                </Button>
            </div>
        </div>
    );
}
