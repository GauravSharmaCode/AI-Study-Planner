"use client";

interface AnalyticsChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function AnalyticsChart({
  percentage,
  size = 140,
  strokeWidth = 10,
  color = "var(--accent-color)",
}: AnalyticsChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: size, height: size }}>
      <svg height={size} width={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          stroke="var(--bg-primary)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "1.75rem",
          fontWeight: "600",
          color: "var(--text-primary)",
          fontFamily: "var(--font-serif)",
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}
