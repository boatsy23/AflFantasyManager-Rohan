import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, Award, BarChart2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ScoreCardProps = {
  title: string;
  value: string;
  change?: string;
  icon?: "chart" | "award" | "trend-up" | "arrow-up";
  isPositive?: boolean;
  className?: string;
  borderColor?: string;
};

export default function ScoreCard({ 
  title, 
  value, 
  change, 
  icon = "trend-up",
  isPositive = true,
  className,
  borderColor = "border-blue-500"
}: ScoreCardProps) {
  // Determine neon glow color based on border color
  const getNeonGlow = () => {
    if (borderColor.includes("blue")) return "shadow-[0_0_15px_rgba(59,130,246,0.5)]";
    if (borderColor.includes("red")) return "shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    if (borderColor.includes("green")) return "shadow-[0_0_15px_rgba(34,197,94,0.5)]";
    if (borderColor.includes("yellow")) return "shadow-[0_0_15px_rgba(234,179,8,0.5)]";
    return "shadow-[0_0_15px_rgba(59,130,246,0.5)]";
  };

  const iconClass = cn(
    "h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300",
    borderColor.includes("blue") && "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    borderColor.includes("red") && "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    borderColor.includes("green") && "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    borderColor.includes("yellow") && "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "h-full bg-gray-800/95 backdrop-blur-sm border-2 transition-all duration-300",
          "active:scale-[0.98] touch-manipulation",
          getNeonGlow(),
          borderColor, 
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-white/90 leading-tight">
              {title}
            </h2>
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              {icon === "chart" && <BarChart2 className={iconClass} />}
              {icon === "award" && <Award className={iconClass} />}
              {icon === "trend-up" && <TrendingUp className={iconClass} />}
              {icon === "arrow-up" && <ArrowUp className={iconClass} />}
            </motion.div>
          </div>
          <motion.div 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {value}
          </motion.div>
          {change && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className={cn(
                "text-sm sm:text-base mt-2 font-medium transition-all duration-300",
                isPositive 
                  ? "text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]" 
                  : "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]"
              )}
            >
              {change}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
