import React from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApproveReward, useRejectReward, Reward } from '@/hooks/useRewards';
import { AppNotification } from '@/hooks/useNotifications';

interface RewardToastProps {
  notification: AppNotification;
  t: string | number;
}

export const RewardToast: React.FC<RewardToastProps> = ({ notification, t }) => {
  const approveReward = useApproveReward();
  const rejectReward = useRejectReward();

  if (!notification.metadata?.reward_id) {
    return <div className="text-sm font-body">{notification.content}</div>;
  }

  // Preenchemos um mock de Reward com os dados que temos para que as mutations funcionem.
  const mockReward: Reward = {
    id: notification.metadata.reward_id,
    name: notification.metadata.name || 'Recompensa',
    cost: notification.metadata.cost || 0,
    redeemed_by: notification.metadata.redeemed_by,
    created_by: '',
    couple_id: '',
    is_redeemed: true,
    redeemed_at: notification.created_at,
    created_at: notification.created_at,
    emoji: '🎁'
  };

  const handleApprove = () => {
    approveReward.mutate(mockReward, {
      onSuccess: () => {
        toast.dismiss(t);
      }
    });
  };

  const handleReject = () => {
    rejectReward.mutate(mockReward, {
      onSuccess: () => {
        toast.dismiss(t);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full p-1 bg-card rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-love/10 flex items-center justify-center shrink-0">
          <span className="text-love text-lg">🎁</span>
        </div>
        <div>
          <p className="text-sm font-display font-black leading-tight text-foreground">{notification.content}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Autorize ou rejeite este resgate</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-8 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-black shadow-none focus:ring-0"
          onClick={handleReject}
          disabled={rejectReward.isPending || approveReward.isPending}
        >
          {rejectReward.isPending ? '...' : <><X className="w-3 h-3 mr-1" /> Rejeitar</>}
        </Button>
        <Button 
          size="sm" 
          className="flex-1 h-8 rounded-xl bg-success text-white hover:bg-success/90 text-xs font-black shadow-[0_0_10px_hsl(var(--success)/0.3)] shadow-none focus:ring-0"
          onClick={handleApprove}
          disabled={rejectReward.isPending || approveReward.isPending}
        >
          {approveReward.isPending ? '...' : <><Check className="w-3 h-3 mr-1" /> Aprovar</>}
        </Button>
      </div>
    </div>
  );
};
