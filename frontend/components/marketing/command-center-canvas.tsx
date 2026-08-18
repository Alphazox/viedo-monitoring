"use client";

import { useEffect, useRef } from "react";

interface CTrack {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pts: [number, number][];
  life: number;
  maxLife: number;
  color: [number, number, number];
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function CommandCenterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function resize() {
      if (!canvas || !ctx) return;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const style = getComputedStyle(document.documentElement);
    const lineColor = style.getPropertyValue("--line").trim() || "#243040";
    const palette = ["--amber", "--crimson", "--teal", "--violet", "--blue"].map((v) =>
      hexToRgb(style.getPropertyValue(v).trim() || "#E8A33D"),
    );

    const rooms: [number, number, number, number][] = [
      [0.06, 0.08, 0.4, 0.36],
      [0.5, 0.08, 0.44, 0.2],
      [0.5, 0.32, 0.44, 0.24],
      [0.06, 0.48, 0.4, 0.28],
      [0.5, 0.6, 0.44, 0.32],
      [0.06, 0.8, 0.88, 0.14],
    ];

    function drawFloorplan() {
      if (!ctx) return;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      rooms.forEach((r) => {
        ctx!.strokeRect(r[0] * w, r[1] * h, r[2] * w, r[3] * h);
      });
      ctx.globalAlpha = 1;
    }

    function makeTrack(): CTrack {
      const ang = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(ang) * (0.2 + Math.random() * 0.3),
        vy: Math.sin(ang) * (0.2 + Math.random() * 0.3),
        pts: [],
        life: 0,
        maxLife: 300 + Math.random() * 200,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    }

    const tracks: CTrack[] = [];
    for (let i = 0; i < 6; i++) tracks.push(makeTrack());

    let raf = 0;
    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawFloorplan();
      tracks.forEach((t, i) => {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < 0 || t.x > w || t.y < 0 || t.y > h || t.life > t.maxLife) {
          tracks[i] = makeTrack();
          return;
        }
        t.life++;
        t.pts.push([t.x, t.y]);
        if (t.pts.length > 40) t.pts.shift();
        for (let j = 1; j < t.pts.length; j++) {
          const a = j / t.pts.length;
          ctx.strokeStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},${a * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(t.pts[j - 1][0], t.pts[j - 1][1]);
          ctx.lineTo(t.pts[j][0], t.pts[j][1]);
          ctx.stroke();
        }
        const head = t.pts[t.pts.length - 1];
        if (head) {
          ctx.fillStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},.9)`;
          ctx.beginPath();
          ctx.arc(head[0], head[1], 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    if (reduced) {
      drawFloorplan();
    } else {
      const loop = () => {
        step();
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
