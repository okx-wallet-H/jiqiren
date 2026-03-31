import { useState } from "react";
import { ChevronDown, TrendingUp, Clock, DollarSign, Users, Zap, Activity } from "lucide-react";
import GridWaveChart from "../components/GridWaveChart";

interface StrategyDetailProps {
  onNavigateToLeaderboard?: () => void;
  onBack?: () => void;
}

const StrategyDetail = ({
  onNavigateToLeaderboard = () => {},
  onBack = () => {},
}: StrategyDetailProps) => {
  const [expanded, setExpanded] = useState(false);

  const stats = [
    { label: "年化收益率", value: "+17.74%", isProfit: true, sub: "" },
    { label: "运行时长", value: "578 日", isProfit: false, sub: "10 小时 43 分" },
    { label: "运行资金", value: "$46.6M", isProfit: false, sub: "USDT" },
    { label: "使用人数", value: "18,918", isProfit: false, sub: "活跃用户" },
  ];

  const params = [
    { label: "网格价格区间 (USDT)", value: "40,000 - 400,000" },
    { label: "网格数量", value: "200" },
    { label: "单格利润", value: "0.88%" },
    { label: "投资金额", value: "任意" },
  ];

  const strategyText = `如果您是 BTC 长期看多者，相信"周期"理论，想要在大的周期高点逃顶低点抄底，该天地网格策略比较适合您。\n\n该天地网格的默认参数涵盖了较大的价格区间，因此更稳健、适合长期持有。网格策略会在价格波动中自动低买高卖，持续积累收益。`;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative px-4 pt-12 pb-6 overflow-hidden">
        {/* Background ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(247,147,26,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,212,160,0.06) 0%, transparent 70%)",
          }}
        />

        {/* BTC Icon + Title row */}
        <div className="relative flex items-center gap-3 mb-4">
          {/* BTC Icon — top-left, prominent */}
          <div
            className="btc-icon w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          >
            <span className="text-2xl font-black" style={{ color: "#fff" }}>₿</span>
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="tech-label">策略</span>
              <span className="tech-label opacity-50">·</span>
              <span className="tech-label" style={{ color: "var(--profit)" }}>运行中</span>
              <div className="w-1.5 h-1.5 rounded-full bg-profit pulse-dot" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
              BTC 大区间网格
            </h1>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex items-center gap-2">
          <div className="green-badge px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium">
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-profit">
              <span className="text-xs font-black" style={{ color: "var(--primary-foreground)" }}>T</span>
            </div>
            投入币种：USDT
            <ChevronDown size={12} />
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <Zap size={11} style={{ color: "#7c3aed" }} />
            <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>天地网格</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2.5">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`p-3.5 flex-1 relative overflow-hidden ${i === 0 ? "stat-card-accent" : "stat-card"}`}
              style={{ minWidth: "44%" }}
            >
              <p className="tech-label mb-2">{s.label}</p>
              <p className={`text-base font-bold leading-tight font-mono ${s.isProfit ? "value-gradient profit-glow" : "text-foreground"}`}>
                {s.value}
              </p>
              {s.sub && <p className="text-xs text-muted-foreground mt-1 opacity-70">{s.sub}</p>}
              {/* Corner accent */}
              {i === 0 && (
                <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{
                  background: "radial-gradient(circle at 100% 0%, rgba(0,212,160,0.12) 0%, transparent 70%)"
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="mx-4 mb-4">
        <hr className="divider-glow" />
      </div>

      {/* ── Strategy Description ────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={15} className="text-profit" />
          <h2 className="text-base font-bold text-foreground">策略说明</h2>
        </div>
        <div className="stat-card p-4">
          <div className="text-sm leading-relaxed" style={{ color: "var(--secondary-foreground)" }}>
            {expanded ? (
              <p className="whitespace-pre-line">{strategyText}</p>
            ) : (
              <p className="line-clamp-3">{strategyText.split("\n")[0]}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-profit mt-3 flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
          >
            {expanded ? "收起" : "展开全部"}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── Wave chart ──────────────────────────────────────── */}
      <div className="mx-4 mb-4 stat-card tech-scan-overlay overflow-hidden">
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <span className="tech-label">价格走势 / 网格信号</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-profit inline-block" />
              <span className="text-muted-foreground">买入</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#e91e8c" }} />
              <span className="text-muted-foreground">卖出</span>
            </span>
          </div>
        </div>
        <GridWaveChart />
      </div>

      {/* ── Strategy Params ─────────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-profit" />
          <h2 className="text-base font-bold text-foreground">策略参数</h2>
        </div>
        <div className="stat-card overflow-hidden">
          <div className="flex flex-wrap">
            {params.map((p, i) => (
              <div
                key={i}
                className="p-3.5 border-b border-border last:border-b-0"
                style={{ width: "50%", borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none" }}
              >
                <p className="tech-label mb-1.5">{p.label}</p>
                <p className="text-sm font-semibold text-foreground font-mono">{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats Icons ────────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="flex gap-2.5">
          {[
            { icon: "trending", label: "历史最高", value: "+77,938", color: "text-profit", accent: "var(--profit)" },
            { icon: "users", label: "活跃用户", value: "18,918", color: "text-foreground", accent: "var(--primary)" },
            { icon: "dollar", label: "总运行资金", value: "$46.6M", color: "text-foreground", accent: "var(--primary)" },
          ].map((item, i) => (
            <div key={i} className="stat-card p-3 flex-1 flex flex-col items-center text-center overflow-hidden relative">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `rgba(${item.accent === "var(--profit)" ? "0,212,160" : "0,212,160"},0.1)`, border: `1px solid rgba(${item.accent === "var(--profit)" ? "0,212,160" : "0,212,160"},0.15)` }}
              >
                {item.icon === "trending" && <TrendingUp size={16} className="text-profit" />}
                {item.icon === "users" && <Users size={16} className="text-profit" />}
                {item.icon === "dollar" && <DollarSign size={16} className="text-profit" />}
              </div>
              <p className="tech-label mb-1">{item.label}</p>
              <p className={`text-xs font-bold font-mono ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard teaser ──────────────────────────────── */}
      <div className="px-4 pb-28">
        <button
          onClick={onNavigateToLeaderboard}
          className="w-full neon-border rounded-2xl p-4 flex items-center justify-between transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, rgba(0,212,160,0.05), rgba(0,212,160,0.02))" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,160,0.1)", border: "1px solid rgba(0,212,160,0.2)" }}>
              <Users size={18} className="text-profit" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">用户收益榜单</p>
              <p className="text-xs text-muted-foreground mt-0.5">查看顶级收益用户排名</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-profit">
            <span className="text-xs font-semibold">查看</span>
            <ChevronDown size={16} className="-rotate-90" />
          </div>
        </button>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: "linear-gradient(to top, var(--background) 70%, transparent)" }}>
        <button
          className="w-full py-4 rounded-2xl font-bold text-base text-primary-foreground green-glow transition-all active:scale-95 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #00d4a0, #00b887)" }}
        >
          <span className="relative z-10">立即创建策略</span>
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)" }} />
        </button>
      </div>
    </div>
  );
};

export default StrategyDetail;
