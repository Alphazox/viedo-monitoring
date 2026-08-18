"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Link from "next/link";
import { Reveal } from "./reveal";
import { GLOBE_SITES, SECTOR_CATEGORIES, siteSector, type GlobeSite } from "@/lib/globeSites";

const EARTH_RADIUS = 150;

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float intensity = dot(vNormalW, sunDirection);
    float blend = smoothstep(-0.18, 0.22, intensity);
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb * 1.4;
    gl_FragColor = vec4(mix(nightColor, dayColor, blend), 1.0);
  }
`;

const FILTERS = [
  { key: "all", label: "All sites" },
  { key: "security", label: "Security-led" },
  { key: "business", label: "Business-facing" },
  { key: "operations", label: "Operations" },
  { key: "regulated", label: "Regulated" },
];

const STATUS_ACCENT: Record<GlobeSite["status"], string> = {
  online: "--teal",
  degraded: "--amber",
  critical: "--crimson",
};

// Site markers are hidden at the default view — a clean globe, nothing else —
// and only fade in once the user zooms past ZOOM_REVEAL_FAR, fully in by
// ZOOM_REVEAL_NEAR. Camera starts at 430, so markers are invisible on load.
const ZOOM_REVEAL_FAR = 380;
const ZOOM_REVEAL_NEAR = 250;

function readAccent(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function makeDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function GlobalMesh() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<GlobeSite | null>(null);
  const filterRef = useRef(filter);
  const selectedRef = useRef(selected);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
    camera.position.set(0, 0, 430);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 220;
    controls.maxDistance = 650;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.4;

    // Sparse, dim starfield — depth behind the planet, not the subject.
    const starPositions: number[] = [];
    for (let i = 0; i < 900; i++) {
      const r = 900 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.1, color: 0xffffff, transparent: true, opacity: 0.55 });
    scene.add(new THREE.Points(starGeo, starMat));

    const loader = new THREE.TextureLoader();
    const dayTexture = loader.load("/textures/earth-day-2k.jpg");
    const nightTexture = loader.load("/textures/earth-night-2k.jpg");
    const cloudsTexture = loader.load("/textures/earth-clouds-2k.jpg");
    [dayTexture, nightTexture, cloudsTexture].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });

    const sunDirection = new THREE.Vector3(0.6, 0.25, 0.9).normalize();

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: EARTH_VERTEX,
      fragmentShader: EARTH_FRAGMENT,
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: sunDirection },
      },
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.008, 96, 96);
    const cloudsMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      alphaMap: cloudsTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(clouds);

    // Illustrative site markers — small, static dots; only the one "critical"
    // site gets a slow, subtle ring pulse. No bouncing/scaling on the rest.
    const dotTexture = makeDotTexture();
    const markers: { site: GlobeSite; sprite: THREE.Sprite; ring?: THREE.Sprite; baseOpacity: number }[] = [];
    GLOBE_SITES.forEach((site) => {
      const sector = siteSector(site);
      const color = readAccent(STATUS_ACCENT[site.status], "#39c2a0");
      const size = site.status === "critical" ? 11 : 8;
      const pos = latLngToVector3(site.lat, site.lng, EARTH_RADIUS * 1.016);

      const mat = new THREE.SpriteMaterial({
        map: dotTexture,
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0, // starts hidden; fades in on zoom (see ZOOM_REVEAL_FAR)
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(pos);
      sprite.scale.set(size, size, 1);
      scene.add(sprite);

      let ring: THREE.Sprite | undefined;
      if (site.status === "critical") {
        const ringMat = new THREE.SpriteMaterial({
          map: dotTexture,
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        ring = new THREE.Sprite(ringMat);
        ring.position.copy(pos);
        ring.scale.set(size, size, 1);
        scene.add(ring);
      }

      markers.push({ site, sprite, ring, baseOpacity: 0.95 });
      void sector; // color already resolved via status; sector kept for the info card only
    });

    // Click-vs-drag: only open the info card if pointerup lands near pointerdown.
    const raycaster = new THREE.Raycaster();
    let downPos: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      const start = downPos;
      downPos = null;
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
      if (controls.getDistance() > ZOOM_REVEAL_FAR) return; // markers aren't shown (or clickable) until zoomed in
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(markers.map((m) => m.sprite));
      if (hits.length > 0) {
        const match = markers.find((m) => m.sprite === hits[0].object);
        if (match) setSelected(match.site);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      clouds.rotation.y += 0.00035;

      // Markers stay hidden until the user zooms in past ZOOM_REVEAL_FAR, fully
      // in by ZOOM_REVEAL_NEAR — the default view is a clean, undecorated globe.
      const distance = controls.getDistance();
      const zoomFactor = THREE.MathUtils.clamp(
        (ZOOM_REVEAL_FAR - distance) / (ZOOM_REVEAL_FAR - ZOOM_REVEAL_NEAR),
        0,
        1,
      );
      if (zoomFactor <= 0.02 && selectedRef.current) setSelected(null);

      markers.forEach(({ site, sprite, ring, baseOpacity }) => {
        const cats = SECTOR_CATEGORIES[site.sectorSlug] ?? [];
        const active = filterRef.current === "all" || cats.includes(filterRef.current);
        const targetOpacity = (active ? baseOpacity : 0.1) * zoomFactor;
        const mat = sprite.material as THREE.SpriteMaterial;
        mat.opacity += (targetOpacity - mat.opacity) * 0.12;

        if (ring) {
          const cycle = (t * 0.3) % 1;
          const s = sprite.scale.x + cycle * 22;
          ring.scale.set(s, s, 1);
          const ringMat = ring.material as THREE.SpriteMaterial;
          const ringTarget = (active ? 0.4 * (1 - cycle) : 0) * zoomFactor;
          ringMat.opacity += (ringTarget - ringMat.opacity) * 0.12;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    const onThemeChange = () => {
      markers.forEach(({ site, sprite, ring }) => {
        const color = readAccent(STATUS_ACCENT[site.status], "#39c2a0");
        (sprite.material as THREE.SpriteMaterial).color.set(color);
        if (ring) (ring.material as THREE.SpriteMaterial).color.set(color);
      });
    };
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      cloudsTexture.dispose();
      dotTexture.dispose();
      markers.forEach(({ sprite, ring }) => {
        (sprite.material as THREE.SpriteMaterial).dispose();
        if (ring) (ring.material as THREE.SpriteMaterial).dispose();
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const selectedSector = selected ? siteSector(selected) : undefined;

  return (
    <section className="sec" id="mesh">
      <div className="container">
        <div className="cc-grid">
          <Reveal>
            <div className="eyebrow">One mesh, every site</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", marginTop: 14 }}>
              Every site reports into the same mesh.
            </h2>
            <p style={{ color: "var(--text-dim)", fontSize: "15.5px", marginTop: 16 }}>
              Retail floor or gated campus, three cameras or three hundred — every site closes the same loop: edge
              detection, human review, signed evidence, one dashboard.
            </p>
            <ul className="cc-points">
              <li>
                <span className="dot-amber" />
                New sites onboard in a day — the mesh doesn&apos;t care if it&apos;s site one or site forty.
              </li>
              <li>
                <span className="dot-teal" />
                Every alert carries its site, its zone and its source frames back to the same review queue.
              </li>
              <li>
                <span className="dot-crimson" />
                One evidence trail across every site, ready for an insurer, an auditor or a regulator.
              </li>
            </ul>
            <div className="gm-layer-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`sf-btn${filter === f.key ? " active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal className="hero-visual network-visual gm-visual">
            <div className="hv-label">Global coverage · illustrative</div>
            <div className="hv-tag">Drag to rotate · Zoom in to see sites</div>
            <div ref={mountRef} className="gm-canvas" />

            {selected && (
              <div className="gm-info-card">
                <button type="button" className="gm-info-close" onClick={() => setSelected(null)} aria-label="Close">
                  ×
                </button>
                <div className="gm-info-status">
                  <span className={`gm-status-dot gm-status-${selected.status}`} />
                  {selected.status}
                  {selectedSector && <span className="gm-info-pack"> · {selectedSector.code} pack</span>}
                </div>
                <div className="gm-info-breadcrumb mono">
                  {selected.country} → {selected.city} → {selected.siteName} → {selected.cameraId}
                </div>
                <p className="gm-info-detection">{selected.detection}</p>
                <p className="gm-info-caption">Illustrative example, not a live feed.</p>
                <Link className="btn btn-primary gm-info-cta" href="/#cta" transitionTypes={["nav-forward"]}>
                  Request a demo
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
