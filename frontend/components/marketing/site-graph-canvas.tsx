"use client";

import { useEffect, useRef } from "react";

interface Track {
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

export function SiteGraphCanvas() {
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

    // Fixed to the dark palette — the hero always renders dark regardless of
    // site theme (see .hero in globals.css), so this reads that scoped value
    // off the canvas itself rather than the (possibly light-themed) root.
    const style = getComputedStyle(canvas);
    const lineColor = style.getPropertyValue("--line").trim() || "#243040";
    const palette = ["--amber", "--crimson", "--teal", "--violet", "--blue", "--pink"].map((v) =>
      hexToRgb(style.getPropertyValue(v).trim() || "#E8A33D"),
    );

    const GRID = 34;
    function drawGrid() {
      if (!ctx) return;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (let x = 0; x <= w; x += GRID) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function makeTrack(): Track {
      const ang = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(ang) * (0.25 + Math.random() * 0.4),
        vy: Math.sin(ang) * (0.25 + Math.random() * 0.4),
        pts: [],
        life: 0,
        maxLife: 420 + Math.random() * 260,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    }

    const N = w < 480 ? 7 : 14;
    const tracks: Track[] = [];
    for (let i = 0; i < N; i++) tracks.push(makeTrack());

    let raf = 0;
    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawGrid();

      tracks.forEach((t, i) => {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < 0 || t.x > w || t.y < 0 || t.y > h || t.life > t.maxLife) {
          tracks[i] = makeTrack();
          return;
        }
        t.life++;
        t.pts.push([t.x, t.y]);
        if (t.pts.length > 60) t.pts.shift();

        for (let j = 1; j < t.pts.length; j++) {
          const a = j / t.pts.length;
          ctx.strokeStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},${a * 0.55})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(t.pts[j - 1][0], t.pts[j - 1][1]);
          ctx.lineTo(t.pts[j][0], t.pts[j][1]);
          ctx.stroke();
        }
        const head = t.pts[t.pts.length - 1];
        if (head) {
          ctx.fillStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},.9)`;
          ctx.beginPath();
          ctx.arc(head[0], head[1], 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    if (reduced) {
      drawGrid();
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
