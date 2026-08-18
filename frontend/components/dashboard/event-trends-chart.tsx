"use client";

import { useMemo, useState } from "react";

export interface TrendPoint {
  label: string;
  current: number;
  previous: number;
}

const CURRENT_COLOR = "#C97F1B";
const PREVIOUS_COLOR = "#6D5BD0";
const WIDTH = 720;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 26, left: 34 };

export function EventTrendsChart({ data }: { data: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { linePathCurrent, linePathPrevious, areaPathCurrent, points, maxValue, yTicks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => Math.max(d.current, d.previous)));
    const niceMax = Math.ceil(max / 4) * 4 || 4;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const xy = (i: number, v: number) => {
      const x = PAD.left + stepX * i;
      const y = PAD.top + innerH * (1 - v / niceMax);
      return [x, y] as const;
    };

    const pts = data.map((d, i) => ({
      x: xy(i, d.current)[0],
      yCurrent: xy(i, d.current)[1],
      yPrevious: xy(i, d.previous)[1],
      d,
    }));

    const lineC = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yCurrent}`).join(" ");
    const lineP = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.yPrevious}`).join(" ");
    const areaC =
      pts.length > 0
        ? `${lineC} L${pts[pts.length - 1].x},${PAD.top + innerH} L${pts[0].x},${PAD.top + innerH} Z`
        : "";

    const ticks = [0, niceMax / 2, niceMax];

    return { linePathCurrent: lineC, linePathPrevious: lineP, areaPathCurrent: areaC, points: pts, maxValue: niceMax, yTicks: ticks };
  }, [data]);

  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left + PAD.left;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="trend-chart">
      <div className="trend-legend">
        <span className="trend-legend-item">
          <span className="trend-key" style={{ background: CURRENT_COLOR }} />
          Current period
        </span>
        <span className="trend-legend-item">
          <span className="trend-key" style={{ background: PREVIOUS_COLOR }} />
          Previous period
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="trend-svg" role="img" aria-label="Event trends over time">
        {yTicks.map((t) => {
          const y = PAD.top + innerH * (1 - t / maxValue);
          return (
            <g key={t}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} className="trend-grid" />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="trend-axis-label">
                {t}
              </text>
            </g>
          );
        })}

        {areaPathCurrent && <path d={areaPathCurrent} fill={CURRENT_COLOR} opacity={0.1} stroke="none" />}
        {linePathPrevious && <path d={linePathPrevious} fill="none" stroke={PREVIOUS_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {linePathCurrent && <path d={linePathCurrent} fill="none" stroke={CURRENT_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {hovered && (
          <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={PAD.top + innerH} className="trend-crosshair" />
        )}
        {hovered && (
          <>
            <circle cx={hovered.x} cy={hovered.yCurrent} r={4} fill={CURRENT_COLOR} stroke="var(--panel)" strokeWidth={2} />
            <circle cx={hovered.x} cy={hovered.yPrevious} r={4} fill={PREVIOUS_COLOR} stroke="var(--panel)" strokeWidth={2} />
          </>
        )}

        {points.map((p, i) =>
          i % Math.ceil(points.length / 8 || 1) === 0 ? (
            <text key={i} x={p.x} y={HEIGHT - 6} textAnchor="middle" className="trend-axis-label">
              {p.d.label}
            </text>
          ) : null
        )}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={WIDTH - PAD.left - PAD.right}
          height={innerH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div className="trend-tooltip" style={{ left: `${(hovered.x / WIDTH) * 100}%` }}>
          <div className="trend-tooltip-label">{hovered.d.label}</div>
          <div className="trend-tooltip-row">
            <span className="trend-key" style={{ background: CURRENT_COLOR }} />
            <span className="trend-tooltip-val">{hovered.d.current}</span> current
          </div>
          <div className="trend-tooltip-row">
            <span className="trend-key" style={{ background: PREVIOUS_COLOR }} />
            <span className="trend-tooltip-val">{hovered.d.previous}</span> previous
          </div>
        </div>
      )}
    </div>
  );
}
