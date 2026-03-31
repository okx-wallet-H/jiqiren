interface UserRankItemProps {
  rank?: number;
  username?: string;
  daysAgo?: number;
  profit?: string;
  invested?: string;
  avatarSeed?: number;
}

const AVATAR_COLORS = [
  ["#0d1f18", "#00d4a0"],
  ["#1f0d14", "#e91e8c"],
  ["#0d1220", "#4a9eff"],
  ["#1f1a0d", "#f59e0b"],
  ["#140d1f", "#8b5cf6"],
];

const UserRankItem = ({
  rank = 1,
  username = `User${rank}`,
  daysAgo = 30,
  profit = "+0.00",
  invested = "0.00",
  avatarSeed = 0,
}: UserRankItemProps) => {
  const colors = AVATAR_COLORS[avatarSeed % AVATAR_COLORS.length];
  const initials = username.slice(0, 2).toUpperCase();

  const rankDisplay = () => {
    if (rank === 1) return { label: "1", cls: "rank-gold font-black text-base" };
    if (rank === 2) return { label: "2", cls: "rank-silver font-black text-base" };
    if (rank === 3) return { label: "3", cls: "rank-bronze font-black text-base" };
    return { label: String(rank), cls: "text-muted-foreground font-semibold text-sm" };
  };

  const rd = rankDisplay();

  return (
    <div
      data-cmp="UserRankItem"
      className="flex items-center py-3.5 px-4 border-b border-border last:border-0 transition-colors"
      style={{ background: rank <= 3 ? `linear-gradient(90deg, rgba(${rank===1?"255,215,0":rank===2?"168,176,192":"205,127,50"},0.03) 0%, transparent 50%)` : "transparent" }}
    >
      {/* Rank */}
      <div className="w-7 flex-shrink-0">
        <span className={rd.cls}>{rd.label}</span>
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mx-3 text-xs font-bold"
        style={{ background: colors[0], border: `1.5px solid ${colors[1]}44` }}
      >
        <span style={{ color: colors[1] }}>{initials}</span>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{username}</p>
        <p className="tech-label mt-0.5">{`${daysAgo} 天前创建`}</p>
      </div>

      {/* Profit */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-profit profit-glow font-mono">{profit}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono opacity-70">{invested}</p>
      </div>
    </div>
  );
};

export default UserRankItem;
