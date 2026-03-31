interface GridLevel {
  price: number;
  buyAmount: number;
  status: "pending" | "filled" | "partial";
  profit: number;
}

const gridLevels: GridLevel[] = [
  { price: 71000, buyAmount: 0.015, status: "pending", profit: 0 },
  { price: 70000, buyAmount: 0.015, status: "pending", profit: 0 },
  { price: 69000, buyAmount: 0.015, status: "pending", profit: 0 },
  { price: 68000, buyAmount: 0.015, status: "pending", profit: 0 },
  { price: 67423, buyAmount: 0.015, status: "partial", profit: 12.4 },
  { price: 66000, buyAmount: 0.015, status: "filled", profit: 38.7 },
  { price: 65000, buyAmount: 0.015, status: "filled", profit: 52.3 },
  { price: 64000, buyAmount: 0.015, status: "filled", profit: 61.8 },
  { price: 63000, buyAmount: 0.015, status: "filled", profit: 78.2 },
  { price: 62000, buyAmount: 0.015, status: "filled", profit: 95.1 },
  { price: 61000, buyAmount: 0.015, status: "filled", profit: 112.6 },
  { price: 60000, buyAmount: 0.015, status: "filled", profit: 130.4 },
];

const statusConfig = {
  filled: { label: "已成交", barClass: "bg-profit", textClass: "text-profit" },
  partial: { label: "部分成交", barClass: "bg-amber-400", textClass: "text-amber-400" },
  pending: { label: "挂单中", barClass: "bg-primary", textClass: "text-muted-foreground" },
};

const GridChart = () => {
  const currentPrice = 67423;
  const upperPrice = 71000;
  const lowerPrice = 60000;
  const priceRange = upperPrice - lowerPrice;
  const pricePosition = ((currentPrice - lowerPrice) / priceRange) * 100;

  const displayLevels = [...gridLevels].sort((a, b) => b.price - a.price);

  return (
    <div data-cmp="GridChart" className="bg-card rounded-2xl p-4 card-glow flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">网格分布</p>
          <p className="text-sm font-bold text-foreground">BTC/USDT 做多</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            {(["filled", "partial", "pending"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-sm ${statusConfig[s].barClass}`} />
                <span className="text-muted-foreground" style={{ fontSize: "10px" }}>
                  {statusConfig[s].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price range bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-muted-foreground" style={{ fontSize: "9px" }}>上限</span>
          <span className="text-foreground font-mono font-semibold text-xs">$71K</span>
        </div>
        <div className="flex-1 relative h-2.5 bg-accent rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full opacity-30"
            style={{ width: `${pricePosition}%`, background: "var(--profit)" }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-amber-400 rounded-full"
            style={{ left: `${pricePosition}%` }}
          />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground" style={{ fontSize: "9px" }}>下限</span>
          <span className="text-foreground font-mono font-semibold text-xs">$60K</span>
        </div>
      </div>

      {/* Current price indicator */}
      <div className="flex items-center justify-center gap-2 py-1.5 bg-accent/60 rounded-xl mb-3">
        <span className="text-xs text-muted-foreground">当前</span>
        <span className="text-xs font-bold text-amber-400 font-mono">${currentPrice.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-primary font-medium">区间 {pricePosition.toFixed(1)}%</span>
      </div>

      {/* Grid levels visual */}
      <div className="flex flex-col gap-1.5 overflow-auto scrollbar-thin" style={{ maxHeight: "260px" }}>
        {displayLevels.map((level, i) => {
          const isCurrent = level.status === "partial";
          const cfg = statusConfig[level.status];
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                isCurrent ? "grid-row-active border border-primary/20" : ""
              }`}
            >
              {/* Price label */}
              <span className="font-mono text-foreground w-14 text-right" style={{ fontSize: "11px" }}>
                ${(level.price / 1000).toFixed(0)}K
              </span>

              {/* Bar */}
              <div className="flex-1 relative h-4 bg-accent rounded-md overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-md ${cfg.barClass} opacity-80`}
                  style={{
                    width:
                      level.status === "filled"
                        ? "100%"
                        : level.status === "partial"
                        ? "50%"
                        : "20%",
                  }}
                />
                {isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold" style={{ fontSize: "9px" }}>
                      当前价
                    </span>
                  </div>
                )}
              </div>

              {/* Profit */}
              <span
                className={`w-12 text-right font-mono text-xs ${
                  level.profit > 0 ? "text-profit" : "text-muted-foreground"
                }`}
                style={{ fontSize: "11px" }}
              >
                {level.profit > 0 ? `+${level.profit.toFixed(1)}` : "--"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridChart;
