import * as React from "react";

export function Gauge({ value, size = 200 }: { value: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startA = -Math.PI * 0.75;
  const endA = Math.PI * 0.75;
  const totalArc = endA - startA;
  const clamped = Math.max(0, Math.min(100, value));
  const progressA = startA + (totalArc * clamped) / 100;

  const polar = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });
  const a0 = polar(startA);
  const a1 = polar(endA);
  const p = polar(progressA);
  const largeArcBg = 1;
  const largeArcFg = clamped > (180 / 270) * 100 ? 1 : 0;

  const color =
    clamped >= 70 ? "#00C48C" : clamped >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcBg} 1 ${a1.x} ${a1.y}`}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {clamped > 0 && (
        <path
          d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcFg} 1 ${p.x} ${p.y}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      )}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        style={{ fontSize: 48, fontWeight: 700, fill: "#1A1A2E" }}
      >
        {Math.round(clamped)}
      </text>
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        style={{
          fontSize: 11,
          fontWeight: 600,
          fill: "#6B7280",
          letterSpacing: "0.12em",
        }}
      >
        /100
      </text>
    </svg>
  );
}
