import { BarChart2, Grid3x3, RefreshCw, SlidersHorizontal } from "lucide-react";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const NAV_ITEMS = [
  { key: "overview", label: "概览", iconName: "barchart" },
  { key: "grid", label: "网格", iconName: "grid" },
  { key: "trades", label: "成交", iconName: "refresh" },
  { key: "settings", label: "参数", iconName: "sliders" },
];

const NavIcon = ({ iconName, active }: { iconName: string; active: boolean }) => {
  const cls = `${active ? "text-primary" : "text-muted-foreground"}`;
  if (iconName === "barchart") return <BarChart2 size={20} className={cls} />;
  if (iconName === "grid") return <Grid3x3 size={20} className={cls} />;
  if (iconName === "refresh") return <RefreshCw size={20} className={cls} />;
  return <SlidersHorizontal size={20} className={cls} />;
};

const BottomNav = ({
  activeTab = "overview",
  onTabChange = () => {},
}: BottomNavProps) => {
  return (
    <div
      data-cmp="BottomNav"
      className="w-full bg-card border-t border-border flex items-center bottom-safe"
      style={{ height: "60px", flexShrink: 0 }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-opacity active:opacity-70"
          >
            <NavIcon iconName={item.iconName} active={isActive} />
            <span
              className={`text-xs font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary"
                style={{ position: "static" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
