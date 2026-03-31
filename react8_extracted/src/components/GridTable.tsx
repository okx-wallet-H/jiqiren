import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface GridOrder {
  id: string;
  level: number;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  status: "filled" | "pending" | "partial";
  profit: number;
  filledAt: string;
  cycles: number;
}

const orders: GridOrder[] = [
  { id: "G001", level: 1, buyPrice: 60000, sellPrice: 61000, amount: 0.015, status: "filled", profit: 130.4, filledAt: "03-15 08:32", cycles: 12 },
  { id: "G002", level: 2, buyPrice: 61000, sellPrice: 62000, amount: 0.015, status: "filled", profit: 112.6, filledAt: "03-16 14:18", cycles: 10 },
  { id: "G003", level: 3, buyPrice: 62000, sellPrice: 63000, amount: 0.015, status: "filled", profit: 95.1, filledAt: "03-18 09:45", cycles: 9 },
  { id: "G004", level: 4, buyPrice: 63000, sellPrice: 64000, amount: 0.015, status: "filled", profit: 78.2, filledAt: "03-20 16:22", cycles: 8 },
  { id: "G005", level: 5, buyPrice: 64000, sellPrice: 65000, amount: 0.015, status: "filled", profit: 61.8, filledAt: "03-22 11:05", cycles: 6 },
  { id: "G006", level: 6, buyPrice: 65000, sellPrice: 66000, amount: 0.015, status: "filled", profit: 52.3, filledAt: "03-25 20:14", cycles: 5 },
  { id: "G007", level: 7, buyPrice: 66000, sellPrice: 67000, amount: 0.015, status: "filled", profit: 38.7, filledAt: "03-28 07:38", cycles: 4 },
  { id: "G008", level: 8, buyPrice: 67000, sellPrice: 68000, amount: 0.015, status: "partial", profit: 12.4, filledAt: "03-29 15:50", cycles: 1 },
  { id: "G009", level: 9, buyPrice: 68000, sellPrice: 69000, amount: 0.015, status: "pending", profit: 0, filledAt: "--", cycles: 0 },
  { id: "G010", level: 10, buyPrice: 69000, sellPrice: 70000, amount: 0.015, status: "pending", profit: 0, filledAt: "--", cycles: 0 },
  { id: "G011", level: 11, buyPrice: 70000, sellPrice: 71000, amount: 0.015, status: "pending", profit: 0, filledAt: "--", cycles: 0 },
];

const TABS = ["全部", "已成交", "挂单中"];

const statusConfig = {
  filled: { icon: CheckCircle, label: "已成交", cls: "text-profit bg-profit/10" },
  pending: { icon: Clock, label: "挂单中", cls: "text-muted-foreground bg-accent" },
  partial: { icon: AlertCircle, label: "部分成交", cls: "text-amber-400 bg-amber-400/10" },
};

const GridTable = () => {
  const [tab, setTab] = useState("全部");

  const filtered =
    tab === "全部"
      ? orders
      : tab === "已成交"
      ? orders.filter((o) => o.status === "filled")
      : orders.filter((o) => o.status !== "filled");

  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);

  return (
    <div data-cmp="GridTable" className="bg-card rounded-2xl card-glow flex flex-col" style={{ minHeight: "360px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-1 bg-accent rounded-xl p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-profit font-semibold font-mono">
            +{totalProfit.toFixed(2)}
          </span>
          <button className="flex items-center gap-1 text-xs text-muted-foreground active:opacity-60">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Order rows */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {filtered.map((order, i) => {
          const cfg = statusConfig[order.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={order.id}
              className={`px-4 py-3 border-b border-border/40 last:border-0 ${
                i % 2 === 1 ? "bg-muted/10" : ""
              }`}
            >
              {/* Row top */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{order.level}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}
                  >
                    <StatusIcon size={10} />
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs font-mono">
                  {order.profit > 0 ? (
                    <span className="text-profit font-bold">
                      +{order.profit.toFixed(2)} USDT
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </div>
              </div>
              {/* Row bottom */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">买</span>
                  <span className="text-xs font-mono text-foreground">
                    ${order.buyPrice.toLocaleString()}
                  </span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "10px" }}>→</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">卖</span>
                  <span className="text-xs font-mono text-foreground">
                    ${order.sellPrice.toLocaleString()}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {order.amount} BTC
                  </span>
                  {order.cycles > 0 && (
                    <span className="text-xs text-primary font-semibold">
                      ×{order.cycles}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridTable;
