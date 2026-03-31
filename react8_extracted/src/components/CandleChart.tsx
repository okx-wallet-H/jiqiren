import { useState } from "react";

const CANDLE_DATA = [
  { o: 63020, h: 65200, l: 62800, c: 64500, date: "02/28" },
  { o: 64500, h: 68200, l: 63800, c: 67600, date: "03/01" },
  { o: 67600, h: 70100, l: 66800, c: 69800, date: "03/02" },
  { o: 69800, h: 72500, l: 68900, c: 71200, date: "03/04" },
  { o: 71200, h: 73800, l: 70100, c: 70500, date: "03/05" },
  { o: 70500, h: 72000, l: 68000, c: 68800, date: "03/06" },
  { o: 68800, h: 71500, l: 67500, c: 70900, date: "03/07" },
  { o: 70900, h: 76012, l: 70200, c: 75200, date: "03/08" },
  { o: 75200, h: 76012, l: 73800, c: 74000, date: "03/10" },
  { o: 74000, h: 75500, l: 72800, c: 73200, date: "03/11" },
  { o: 73200, h: 74800, l: 71500, c: 72600, date: "03/12" },
  { o: 72600, h: 73900, l: 70500, c: 71000, date: "03/14" },
  { o: 71000, h: 72500, l: 69200, c: 71800, date: "03/15" },
  { o: 71800, h: 73200, l: 70000, c: 70300, date: "03/16" },
  { o: 70300, h: 71800, l: 68500, c: 69500, date: "03/17" },
  { o: 69500, h: 70800, l: 67200, c: 67800, date: "03/18" },
  { o: 67800, h: 69200, l: 66000, c: 66500, date: "03/20" },
  { o: 66500, h: 68000, l: 65200, c: 67200, date: "03/21" },
  { o: 67200, h: 68500, l: 65800, c: 66200, date: "03/22" },
  { o: 66200, h: 67800, l: 64500, c: 65500, date: "03/24" },
  { o: 65500, h: 68200, l: 65000, c: 67882, date: "03/25" },
];

const TIMEFRAMES = ["15分", "1时", "4时", "1日", "更多"];

const W = 380;
const H = 220;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 52;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

interface CandleChartProps {
  activeTab?: string;
}

const CandleChart = ({ activeTab = "1日" }: CandleChartProps) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  const allValues = CANDLE_DATA.flatMap((c) => [c.h, c.l]);
  const minVal = Math.min(...allValues) - 500;
  const maxVal = Math.max(...allValues) + 500;
  const range = maxVal - minVal;

  const chartW = W - PADDING_LEFT - PADDING_RIGHT;
  const chartH = H - PADDING_TOP - PADDING_BOTTOM;

  const toX = (i: number) => PADDING_LEFT + (i + 0.5) * (chartW / CANDLE_DATA.length);
  const toY = (v: number) => PADDING_TOP + chartH - ((v - minVal) / range) * chartH;

  const candleW = Math.max(2, (chartW / CANDLE_DATA.length) * 0.55);

  const priceLines = [75000, 72500, 70000, 67500, 65000];

  const lastCandle = CANDLE_DATA[CANDLE_DATA.length - 1];
  const currentPrice = lastCandle.c;
  const currentPriceY = toY(currentPrice);

  const highPoint = CANDLE_DATA.reduce((a, b) => (a.h > b.h ? a : b));
  const highIdx = CANDLE_DATA.indexOf(highPoint);
  const highX = toX(highIdx);
  const highY = toY(highPoint.h);

  const lowPoint = CANDLE_DATA.reduce((a, b) => (a.l < b.l ? a : b));
  const lowIdx = CANDLE_DATA.indexOf(lowPoint);
  const lowX = toX(lowIdx);
  const lowY = toY(lowPoint.l);

  const dateTicks = [0, 5, 10, 15, 20];

  return (
    <div data-cmp="CandleChart" className="w-full">
      {/* Timeframe tabs */}
      <div className="flex items-center gap-1 px-4 pb-2">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTab(t)}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              selectedTab === t
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "220px" }}
          preserveAspectRatio="none"
        >
          {/* Background */}
          <rect x="0" y="0" width={W} height={H} fill="transparent" />

          {/* Horizontal grid lines */}
          {priceLines.map((price) => {
            const y = toY(price);
            return (
              <g key={price}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={W - PADDING_RIGHT}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={W - PADDING_RIGHT + 4}
                  y={y + 4}
                  fontSize="8"
                  fill="rgba(255,255,255,0.3)"
                >
                  {price.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Current price line */}
          <line
            x1={PADDING_LEFT}
            y1={currentPriceY}
            x2={W - PADDING_RIGHT}
            y2={currentPriceY}
            stroke="var(--profit)"
            strokeWidth="0.8"
            strokeDasharray="4,3"
            opacity="0.7"
          />

          {/* High marker */}
          <line
            x1={highX}
            y1={highY - 6}
            x2={highX}
            y2={highY - 18}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
          />
          <text x={highX - 2} y={highY - 20} fontSize="7" fill="rgba(255,255,255,0.5)" textAnchor="end">
            {highPoint.h.toLocaleString()}
          </text>

          {/* Low marker */}
          <line
            x1={lowX}
            y1={lowY + 6}
            x2={lowX}
            y2={lowY + 18}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
          />
          <text x={lowX} y={lowY + 27} fontSize="7" fill="rgba(255,255,255,0.5)" textAnchor="middle">
            {lowPoint.l.toLocaleString()}
          </text>

          {/* Candles */}
          {CANDLE_DATA.map((c, i) => {
            const bull = c.c >= c.o;
            const color = bull ? "var(--profit)" : "var(--loss)";
            const x = toX(i);
            const bodyTop = toY(Math.max(c.o, c.c));
            const bodyBot = toY(Math.min(c.o, c.c));
            const bodyH = Math.max(1.5, bodyBot - bodyTop);

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={toY(c.h)}
                  x2={x}
                  y2={toY(c.l)}
                  stroke={color}
                  strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={bull ? "var(--profit)" : "var(--loss)"}
                  opacity="0.9"
                />
              </g>
            );
          })}

          {/* Current price label */}
          <rect
            x={W - PADDING_RIGHT}
            y={currentPriceY - 9}
            width={PADDING_RIGHT - 2}
            height={18}
            rx="3"
            fill="var(--profit)"
            opacity="0.9"
          />
          <text
            x={W - PADDING_RIGHT + (PADDING_RIGHT - 2) / 2}
            y={currentPriceY + 4}
            fontSize="7.5"
            fill="var(--primary-foreground)"
            textAnchor="middle"
            fontWeight="600"
          >
            {currentPrice.toLocaleString()}
          </text>

          {/* Date axis */}
          {dateTicks.map((i) => {
            const d = CANDLE_DATA[i];
            if (!d) return null;
            const x = toX(i);
            return (
              <text
                key={i}
                x={x}
                y={H - 6}
                fontSize="7"
                fill="rgba(255,255,255,0.3)"
                textAnchor="middle"
              >
                2026/{d.date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CandleChart;
