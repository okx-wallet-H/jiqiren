import { ArrowUp, ArrowDown } from "lucide-react";

interface Trade {
  time: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  value: number;
  pnl: number;
}

const recentTrades: Trade[] = [
  { time: "03-29 15:52", type: "sell", price: 68000, amount: 0.015, value: 1020, pnl: 15.0 },
  { time: "03-29 15:50", type: "buy", price: 67000, amount: 0.015, value: 1005, pnl: 0 },
  { time: "03-28 09:20", type: "sell", price: 67000, amount: 0.015, value: 1005, pnl: 15.0 },
  { time: "03-27 22:11", type: "buy", price: 66000, amount: 0.015, value: 990, pnl: 0 },
  { time: "03-27 18:34", type: "sell", price: 66000, amount: 0.015, value: 990, pnl: 15.0 },
  { time: "03-26 14:05", type: "buy", price: 65000, amount: 0.015, value: 975, pnl: 0 },
  { time: "03-25 20:14", type: "sell", price: 65000, amount: 0.015, value: 975, pnl: 15.0 },
  { time: "03-24 11:22", type: "buy", price: 64000, amount: 0.015, value: 960, pnl: 0 },
  { time: "03-23 08:41", type: "sell", price: 64000, amount: 0.015, value: 960, pnl: 15.0 },
  { time: "03-22 19:30", type: "buy", price: 63000, amount: 0.015, value: 945, pnl: 0 },
];

const RecentTrades = () => {
  return (
    <div data-cmp="RecentTrades" className="bg-card rounded-2xl card-glow flex flex-col" style={{ minHeight: "360px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <p className="text-sm font-bold text-foreground">最近成交</p>
        <button className="text-xs text-primary font-medium">查看全部</button>
      </div>

      {/* Column labels */}
      <div className="flex items-center px-4 py-2 border-b border-border/40">
        <span className="text-muted-foreground w-10" style={{ fontSize: "10px" }}>方向</span>
        <span className="text-muted-foreground flex-1" style={{ fontSize: "10px" }}>价格 / 数量</span>
        <span className="text-muted-foreground w-20 text-right" style={{ fontSize: "10px" }}>金额</span>
        <span className="text-muted-foreground w-16 text-right" style={{ fontSize: "10px" }}>单格收益</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {recentTrades.map((trade, i) => {
          const isBuy = trade.type === "buy";
          return (
            <div
              key={i}
              className="flex items-center px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors"
            >
              {/* Direction badge */}
              <div
                className={`flex items-center gap-0.5 font-bold w-10 ${
                  isBuy ? "text-profit" : "text-loss"
                }`}
                style={{ fontSize: "11px" }}
              >
                {isBuy ? (
                  <ArrowDown size={11} />
                ) : (
                  <ArrowUp size={11} />
                )}
                {isBuy ? "买" : "卖"}
              </div>

              {/* Price / Amount */}
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-mono text-foreground">
                  ${trade.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground font-mono" style={{ fontSize: "10px" }}>
                  {trade.amount} BTC
                </span>
              </div>

              {/* Value */}
              <div className="w-20 text-right">
                <span className="text-xs font-mono text-muted-foreground">
                  ${trade.value}
                </span>
              </div>

              {/* PnL */}
              <div className="w-16 text-right">
                {trade.pnl > 0 ? (
                  <span className="text-xs font-mono font-bold text-profit">
                    +{trade.pnl.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-border/40 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">共 {recentTrades.length} 条记录</span>
        <span className="text-xs text-profit font-semibold">
          套利收益 +{recentTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0).toFixed(2)} USDT
        </span>
      </div>
    </div>
  );
};

export default RecentTrades;
