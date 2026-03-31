import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label?: string;
  value?: string;
  subValue?: string;
  changePercent?: number;
  unit?: string;
  highlight?: boolean;
  accentColor?: "profit" | "loss" | "primary" | "warning";
}

const StatCard = ({
  label = "统计项",
  value = "--",
  subValue = "",
  changePercent = 0,
  unit = "",
  highlight = false,
  accentColor = "primary",
}: StatCardProps) => {
  const isProfit = changePercent >= 0;

  const valueColorMap: Record<string, string> = {
    profit: "text-profit",
    loss: "text-loss",
    primary: "text-primary",
    warning: "text-amber-400",
  };

  return (
    <div
      data-cmp="StatCard"
      className="bg-card rounded-2xl p-4 flex flex-col gap-2 card-glow"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-xl font-bold font-mono tracking-tight ${
            highlight ? valueColorMap[accentColor] : "text-foreground"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
        {changePercent !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold ml-auto ${
              isProfit ? "text-profit" : "text-loss"
            }`}
          >
            {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>
              {isProfit ? "+" : ""}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
