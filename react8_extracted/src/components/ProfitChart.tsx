import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useState } from "react";

const generateProfitData = () => {
  const data = [];
  let profit = 0;
  const startDate = new Date("2024-10-01");
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dailyChange = (Math.random() - 0.38) * 120 + 30;
    profit += dailyChange;
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      profit: Math.round(profit * 100) / 100,
      daily: Math.round(dailyChange * 100) / 100,
    });
  }
  return data;
};

const profitData = generateProfitData();
const RANGES = ["7D", "30D", "全部"];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isPos = val >= 0;
    return (
      <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-custom">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={`text-sm font-bold font-mono ${
            isPos ? "text-profit" : "text-loss"
          }`}
        >
          {isPos ? "+" : ""}
          {val.toFixed(2)} USDT
        </p>
      </div>
    );
  }
  return null;
};

const ProfitChart = () => {
  const [range, setRange] = useState("全部");
  const sliceMap: Record<string, number> = { "7D": 7, "30D": 30, "全部": 90 };
  const sliced = profitData.slice(-sliceMap[range]);
  const currentProfit = sliced[sliced.length - 1]?.profit ?? 0;
  const isPositive = currentProfit >= 0;
  const profitColor = "#0ecb81";
  const lossColor = "#f6465d";
  const lineColor = isPositive ? profitColor : lossColor;

  return (
    <div
      data-cmp="ProfitChart"
      className="bg-card rounded-2xl p-4 card-glow flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">累计收益</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                isPositive ? "text-profit profit-glow" : "text-loss"
              }`}
            >
              {isPositive ? "+" : ""}
              {currentProfit.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">USDT</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-accent rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "140px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sliced}
            margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={profitColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={profitColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mLossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lossColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={lossColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#222c42"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#5a6a82", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(sliced.length / 4)}
            />
            <YAxis
              tick={{ fill: "#5a6a82", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#222c42" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="profit"
              stroke={lineColor}
              strokeWidth={2}
              fill={
                isPositive ? "url(#mProfitGrad)" : "url(#mLossGrad)"
              }
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitChart;
