const GridWaveChart = () => {
  const W = 320;
  const H = 200;

  // Sine wave path points
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * 2 * Math.PI * 1.8;
    const x = 20 + (i / 100) * (W - 40);
    const y = H / 2 - Math.sin(t) * 62 - 10;
    points.push({ x, y });
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Sell points (local maxima)
  const sellPoints = [
    { x: points[13].x, y: points[13].y },
    { x: points[55].x, y: points[55].y },
  ];

  // Buy points (local minima)
  const buyPoints = [
    { x: points[36].x, y: points[36].y },
    { x: points[77].x, y: points[77].y },
    { x: points[93].x, y: points[93].y },
  ];

  // Extra midpoints
  const midPoints = [
    { x: points[0].x, y: points[0].y },
    { x: points[26].x, y: points[26].y },
    { x: points[47].x, y: points[47].y },
    { x: points[67].x, y: points[67].y },
    { x: points[87].x, y: points[87].y },
  ];

  // Horizontal grid lines
  const gridLines = [
    { y: H * 0.15, label: "" },
    { y: H * 0.35, label: "" },
    { y: H * 0.55, label: "" },
    { y: H * 0.75, label: "" },
    { y: H * 0.9, label: "" },
  ];

  const lastPoint = points[points.length - 1];

  return (
    <div data-cmp="GridWaveChart" className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "200px" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill="transparent" />

        {/* Grid area fill */}
        <rect x="20" y="0" width={W - 40} height={H} fill="rgba(0,200,150,0.02)" rx="4" />

        {/* Horizontal grid dashes */}
        {gridLines.map((line, i) => (
          <line
            key={i}
            x1="20"
            y1={line.y}
            x2={W - 20}
            y2={line.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3,4"
          />
        ))}

        {/* Price label top */}
        <rect x="20" y="4" width="48" height="18" rx="4" fill="var(--foreground)" opacity="0.9" />
        <text x="44" y="16" fontSize="9" fill="var(--background)" textAnchor="middle" fontWeight="700">
          Price
        </text>

        {/* Wave path */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sell dots (pink/magenta) */}
        {sellPoints.map((p, i) => (
          <circle key={`sell-${i}`} cx={p.x} cy={p.y} r="5" fill="#e91e8c" opacity="0.9" />
        ))}

        {/* Buy dots (green) */}
        {buyPoints.map((p, i) => (
          <circle key={`buy-${i}`} cx={p.x} cy={p.y} r="5" fill="var(--profit)" opacity="0.9" />
        ))}

        {/* Mid dots (green, smaller) */}
        {midPoints.map((p, i) => (
          <circle key={`mid-${i}`} cx={p.x} cy={p.y} r="3.5" fill="var(--profit)" opacity="0.7" />
        ))}

        {/* End dot */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="6" fill="var(--foreground)" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="var(--background)" />

        {/* S label (Sell) */}
        <rect x="20" y={sellPoints[0].y - 28} width="20" height="20" rx="4" fill="rgba(233,30,140,0.15)" stroke="rgba(233,30,140,0.4)" strokeWidth="1" />
        <text x="30" y={sellPoints[0].y - 15} fontSize="9" fill="#e91e8c" textAnchor="middle" fontWeight="700">S</text>

        {/* B labels (Buy) */}
        {buyPoints.slice(0, 2).map((p, i) => (
          <g key={`blabel-${i}`}>
            <rect x="20" y={p.y + (i === 0 ? 8 : 8)} width="20" height="20" rx="4" fill="rgba(0,200,150,0.12)" stroke="rgba(0,200,150,0.35)" strokeWidth="1" />
            <text x="30" y={p.y + (i === 0 ? 21 : 21)} fontSize="9" fill="var(--profit)" textAnchor="middle" fontWeight="700">B</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default GridWaveChart;
