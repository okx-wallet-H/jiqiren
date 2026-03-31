import { Bell, ChevronDown, Settings, Activity } from "lucide-react";

interface MobileHeaderProps {
  currentPrice?: string;
  priceChange?: string;
  isPositive?: boolean;
}

const MobileHeader = ({
  currentPrice = "67,423.50",
  priceChange = "+2.34%",
  isPositive = true,
}: MobileHeaderProps) => {
  return (
    <div
      data-cmp="MobileHeader"
      className="w-full border-b border-border px-4 flex items-center justify-between relative overflow-hidden"
      style={{ height: "56px", flexShrink: 0, background: "var(--card)" }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,160,0.3), transparent)" }} />

      {/* Left: BTC Icon + Pair selector */}
      <div className="flex items-center gap-2.5">
        <div className="btc-icon w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black" style={{ color: "#fff" }}>₿</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-foreground font-bold text-sm">BTC/USDT</span>
          <ChevronDown size={13} className="text-muted-foreground" />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-profit" : "text-loss"}`}>
          <span>{isPositive ? "+" : ""}{priceChange}</span>
        </div>
      </div>

      {/* Center: Price */}
      <div className="flex flex-col items-center">
        <span className={`text-base font-bold font-mono tracking-tight ${isPositive ? "text-profit profit-glow" : "text-loss"}`}>
          ${currentPrice}
        </span>
        <span className="tech-label">永续合约</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-accent relative">
          <Bell size={16} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-profit pulse-dot" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-accent">
          <Settings size={16} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
