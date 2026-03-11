import { Sparkles } from "lucide-react";

interface XpBadgeProps {
  amount: number;
  size?: "sm" | "md";
}

const XpBadge = ({ amount, size = "sm" }: XpBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-display font-bold text-xp bg-xp/10 rounded-full ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      +{amount} XP
    </span>
  );
};

export default XpBadge;
