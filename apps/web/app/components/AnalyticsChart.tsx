"use client";

interface AnalyticsChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function AnalyticsChart({
  percentage,
  size = 120,
  strokeWidth = 12,
  color = "#3b82f6",
}: AnalyticsChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: size, height: size }}>
      <svg height={size} width={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          stroke="#e5e7eb"
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
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
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
          fontSize: "24px",
          fontWeight: "bold",
          color: "#1f2937",
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}