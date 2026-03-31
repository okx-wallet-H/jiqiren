import { ChevronLeft, ChevronRight, Trophy, TrendingUp } from "lucide-react";
import CandleChart from "../components/CandleChart";
import UserRankItem from "../components/UserRankItem";

interface LeaderboardPageProps {
  onBack?: () => void;
}

const LEADERBOARD_DATA = [
  { rank: 1, username: "186***6077", daysAgo: 464, profit: "+77,938.36", invested: "932,074.87", avatarSeed: 0 },
  { rank: 2, username: "火麒麟火", daysAgo: 177, profit: "+36,510.48", invested: "700,000.10", avatarSeed: 1 },
  { rank: 3, username: "mad***@163.com", daysAgo: 130, profit: "+10,986.97", invested: "400,000.00", avatarSeed: 2 },
  { rank: 4, username: "RickC137", daysAgo: 9, profit: "+9,638.91", invested: "1,155,600.00", avatarSeed: 3 },
  { rank: 5, username: "aig***@gmail.com", daysAgo: 53, profit: "+9,268.96", invested: "98,019.65", avatarSeed: 4 },
  { rank: 6, username: "crypto***2024", daysAgo: 89, profit: "+7,421.30", invested: "250,000.00", avatarSeed: 0 },
  { rank: 7, username: "btc***hodler", daysAgo: 201, profit: "+6,812.44", invested: "180,000.00", avatarSeed: 1 },
];

const LeaderboardPage = ({ onBack = () => {} }: LeaderboardPageProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative px-4 pt-12 pb-4 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-36 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 30% 0%, rgba(247,147,26,0.1) 0%, transparent 70%)" }}
        />

        <div className="relative flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all active:scale-90"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <ChevronLeft size={18} className="text-foreground" />
          </button>

          {/* BTC Icon */}
          <div className="btc-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-black" style={{ color: "#fff" }}>₿</span>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="tech-label mb-0.5">BTC 大区间网格</p>
            <h1 className="text-base font-bold text-foreground leading-tight">用户收益榜单</h1>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neon-border">
            <div className="w-1.5 h-1.5 rounded-full bg-profit pulse-dot" />
            <span className="tech-label text-profit">实时</span>
          </div>
        </div>
      </div>

      {/* ── Info bar ────────────────────────────────────────── */}
      <div className="mx-4 mb-3 stat-card p-3.5">
        <div className="flex gap-5">
          <div>
            <p className="tech-label mb-1">网格价格区间 (USDT)</p>
            <p className="text-sm font-bold text-foreground font-mono">40,000 — 400,000</p>
          </div>
          <div className="w-px" style={{ background: "var(--border)" }} />
          <div>
            <p className="tech-label mb-1">网格数量</p>
            <p className="text-sm font-bold text-foreground font-mono">200</p>
          </div>
          <div className="w-px" style={{ background: "var(--border)" }} />
          <div>
            <p className="tech-label mb-1">年化收益</p>
            <p className="text-sm font-bold value-gradient font-mono">+17.74%</p>
          </div>
        </div>
      </div>

      {/* ── Candle Chart ────────────────────────────────────── */}
      <div className="mx-4 mb-4 stat-card tech-scan-overlay overflow-hidden">
        <CandleChart activeTab="1日" />
      </div>

      {/* ── Top 3 highlight ─────────────────────────────────── */}
      <div className="px-4 mb-3">
        <div className="flex gap-2">
          {LEADERBOARD_DATA.slice(0, 3).map((item) => (
            <div
              key={item.rank}
              className="flex-1 stat-card p-3 flex flex-col items-center text-center"
            >
              <span className={`text-lg font-black mb-1 ${item.rank === 1 ? "rank-gold" : item.rank === 2 ? "rank-silver" : "rank-bronze"}`}>
                #{item.rank}
              </span>
              <p className="text-xs text-foreground font-semibold truncate w-full text-center mb-0.5">{item.username.slice(0, 8)}</p>
              <p className="text-xs font-bold text-profit font-mono">{item.profit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard ─────────────────────────────────────── */}
      <div className="mx-4 mb-28">
        {/* Section header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-profit" />
            <span className="text-sm font-bold text-foreground">完整榜单</span>
          </div>
          <button className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            查看全部
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Column labels */}
        <div className="flex justify-between items-center px-4 py-2 mb-1">
          <span className="tech-label">排名 / 用户</span>
          <span className="tech-label">收益 / 投入金额 (USDT)</span>
        </div>

        {/* List */}
        <div className="stat-card overflow-hidden">
          {LEADERBOARD_DATA.map((item) => (
            <UserRankItem
              key={item.rank}
              rank={item.rank}
              username={item.username}
              daysAgo={item.daysAgo}
              profit={item.profit}
              invested={item.invested}
              avatarSeed={item.avatarSeed}
            />
          ))}
        </div>

        {/* Load more */}
        <button className="w-full py-3 mt-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 hover:text-foreground transition-colors">
          <span>加载更多</span>
          <ChevronRight size={13} className="rotate-90" />
        </button>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: "linear-gradient(to top, var(--background) 70%, transparent)" }}>
        <button
          className="w-full py-4 rounded-2xl font-bold text-base text-primary-foreground green-glow transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #00d4a0, #00b887)" }}
        >
          <TrendingUp size={18} />
          立即创建策略
        </button>
      </div>
    </div>
  );
};

export default LeaderboardPage;
