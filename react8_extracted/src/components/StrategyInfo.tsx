import { Shield, Zap, TrendingUp, Clock, Layers, DollarSign, AlertTriangle } from "lucide-react";

interface InfoRowProps {
  iconName: string;
  label: string;
  value: string;
  valueClass?: string;
}

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  zap: Zap,
  trending: TrendingUp,
  clock: Clock,
  layers: Layers,
  dollar: DollarSign,
  alert: AlertTriangle,
};

const InfoRow = ({
  iconName = "shield",
  label = "",
  value = "",
  valueClass = "text-foreground",
}: InfoRowProps) => {
  const Icon = iconMap[iconName] || Shield;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xs font-semibold font-mono ${valueClass}`}>{value}</span>
    </div>
  );
};

const StrategyInfo = () => {
  return (
    <div data-cmp="StrategyInfo" className="bg-card rounded-2xl p-4 card-glow flex flex-col gap-4">
      {/* Strategy header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">策略信息</p>
          <p className="text-base font-bold text-foreground">BTC 合约网格</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-profit bg-profit/10 px-3 py-1.5 rounded-full border border-profit/20">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-50" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-profit" />
          </span>
          运行中
        </div>
      </div>

      {/* Params */}
      <div className="bg-accent/40 rounded-xl px-3">
        <InfoRow iconName="layers" label="网格数量" value="11 格" />
        <InfoRow iconName="dollar" label="投资金额" value="5,000 USDT" />
        <InfoRow iconName="shield" label="杠杆倍数" value="3x" valueClass="text-amber-400" />
        <InfoRow iconName="trending" label="价格区间" value="$60K–$71K" />
        <InfoRow iconName="zap" label="每格利润" value="≈1.64%" valueClass="text-profit" />
        <InfoRow iconName="clock" label="运行时长" value="89天 14小时" />
      </div>

      {/* Risk metrics */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={12} className="text-amber-400" />
          <p className="text-xs font-medium text-foreground">风险指标</p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: "强平价格", value: "$42,800", warn: true },
            { label: "保证金率", value: "68.4%", warn: false },
            { label: "可用保证金", value: "1,248 USDT", warn: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span
                className={`text-xs font-semibold font-mono ${
                  item.warn ? "text-loss" : "text-foreground"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Safety bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">安全边际</span>
            <span className="text-xs text-profit font-semibold">36.5%</span>
          </div>
          <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: "63.5%",
                background: "linear-gradient(90deg, #0ecb81, #34d399)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-muted-foreground" style={{ fontSize: "10px" }}>强平价</span>
            <span className="text-muted-foreground" style={{ fontSize: "10px" }}>当前价</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity active:scale-95">
          调整参数
        </button>
        <button className="flex-1 py-2.5 rounded-xl bg-accent text-muted-foreground text-xs font-bold hover:bg-secondary transition-colors border border-border active:scale-95">
          停止策略
        </button>
      </div>
    </div>
  );
};

export default StrategyInfo;
