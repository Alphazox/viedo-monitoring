"use client";

import { useEffect, useState } from "react";
import { aiEngineClient, aiEngineVideoUrl, AiEngineError, type Alert } from "@/lib/api/aiEngineClient";

interface DemoClip {
  label: string;
  url: string;
  suspicious?: boolean;
}

const ALERT_LABELS: Record<Alert["type"], string> = {
  person_detected: "Person detected",
  loitering: "Loitering / suspicious activity",
  watchlist_match: "Watchlist match",
  intrusion: "Zone intrusion",
  fall_detected: "Fall detected",
};

const SEVERITY_TONE: Record<Alert["severity"], string> = {
  info: "",
  warning: "tone-amber",
  critical: "tone-red",
};

interface UploadResult {
  kind: "detect" | "gait" | "fall";
  videoUrl: string | null;
  statsText: string;
  suspicious?: boolean;
}

export default function EventsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clips, setClips] = useState<DemoClip[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState<"detect" | "gait" | "fall" | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function refreshAlerts() {
    const res = await aiEngineClient.alerts();
    setAlerts([...res.items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setOffline(false);
  }

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await aiEngineClient.alerts();
        setAlerts([...res.items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setOffline(false);
      } catch (err) {
        setOffline(err instanceof AiEngineError);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  async function runDemo(key: "gait" | "activity" | "seed" | "detection" | "fall") {
    setBusy(key);
    setMessage(null);
    setClips([]);
    try {
      if (key === "seed") {
        const res = await aiEngineClient.seedGaitGallery();
        setMessage(`Seeded ${res.subjects.length} demo profiles into the gait gallery.`);
        setClips(res.subjects.map((s) => ({ label: s.label, url: aiEngineVideoUrl(s.video_url) })));
      } else if (key === "gait") {
        const res = await aiEngineClient.runGaitDemo();
        setMessage(
          res.match
            ? `Gait demo pipeline ran — matched the watch clip to "${res.match.label}" at ${(res.match.similarity * 100).toFixed(1)}% similarity.`
            : "Gait demo pipeline ran — enrolled a subject, then matched it against a watch clip."
        );
        const enrollStep = res.steps.find((s) => s.step === "enroll");
        const watchStep = res.steps.find((s) => s.step === "watch");
        setClips(
          [
            enrollStep && { label: "Enrolled clip (first half)", url: aiEngineVideoUrl(enrollStep.video_url) },
            watchStep && { label: "Watch clip (second half)", url: aiEngineVideoUrl(watchStep.video_url) },
          ].filter((c): c is DemoClip => Boolean(c))
        );
      } else if (key === "activity") {
        const res = await aiEngineClient.runActivityDemo();
        setMessage("Activity demo pipeline ran across day/night loitering scenarios.");
        setClips(
          res.scenarios.map((s) => ({
            label: `${s.camera_label} — ${s.analysis.suspicious ? "ALERT" : "no alert"}`,
            url: aiEngineVideoUrl(s.video_url),
            suspicious: s.analysis.suspicious,
          }))
        );
      } else if (key === "detection") {
        const res = await aiEngineClient.runDetectionDemo();
        setMessage(
          `Object detection demo ran — ${res.tracks_found} track${res.tracks_found === 1 ? "" : "s"} found across ${res.frames_processed} frames.`
        );
        setClips([{ label: "YOLO + DeepSORT tracking", url: aiEngineVideoUrl(res.video) }]);
      } else {
        const res = await aiEngineClient.runFallDemo();
        setMessage(
          res.fell && res.event
            ? `Fall demo ran — possible fall detected at ${res.event.timestamp_seconds}s (${(res.event.confidence * 100).toFixed(0)}% confidence).`
            : "Fall demo ran — no fall detected above the confidence threshold."
        );
        if (res.video_url) {
          setClips([
            {
              label: res.fell ? `Fall detected — ${((res.event?.confidence ?? 0) * 100).toFixed(0)}% confidence` : "No fall detected",
              url: aiEngineVideoUrl(res.video_url),
              suspicious: res.fell,
            },
          ]);
        }
      }
      await refreshAlerts();
    } catch (err) {
      setMessage(err instanceof AiEngineError ? err.message : "The AI engine isn't reachable.");
    } finally {
      setBusy(null);
    }
  }

  async function runUpload(kind: "detect" | "gait" | "fall") {
    if (!uploadFile) return;
    setUploadBusy(kind);
    setUploadError(null);
    setUploadResult(null);
    try {
      if (kind === "detect") {
        const res = await aiEngineClient.detectAnnotate(uploadFile);
        setUploadResult({
          kind,
          videoUrl: aiEngineVideoUrl(res.video),
          statsText: `${res.tracks_found} track${res.tracks_found === 1 ? "" : "s"} found across ${res.frames_processed} frames (up to ${res.max_detections_in_frame} objects in a single frame).`,
        });
      } else if (kind === "gait") {
        const res = await aiEngineClient.gaitVisualize(uploadFile);
        setUploadResult({
          kind,
          videoUrl: aiEngineVideoUrl(res.video),
          statsText: res.gei_captured
            ? `Gait signature (GEI) captured from ${res.silhouette_frames_used} silhouette frames across ${res.frames_processed} total frames.`
            : `Processed ${res.frames_processed} frames, but no gait signature was captured — try a clip with a clearer full-body side view.`,
        });
      } else {
        const res = await aiEngineClient.fallAnalyze(uploadFile);
        setUploadResult({
          kind,
          videoUrl: res.video_url ? aiEngineVideoUrl(res.video_url) : null,
          suspicious: res.fell,
          statsText: res.fell && res.event
            ? `Possible fall detected at ${res.event.timestamp_seconds}s (${(res.event.confidence * 100).toFixed(0)}% confidence).`
            : `No fall detected across ${res.frames_processed} frames.`,
        });
        await refreshAlerts();
      }
    } catch (err) {
      setUploadError(
        err instanceof AiEngineError ? err.message : "The AI engine isn't reachable."
      );
    } finally {
      setUploadBusy(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>AI Events</h1>
          <p>YOLO object detection, DeepSORT tracking, gait re-identification, activity/loitering rules, and fall detection — run against demo footage or your own.</p>
        </div>
      </div>

      {offline && (
        <div className="dash-empty" style={{ textAlign: "left", marginBottom: 20, borderRadius: 6, border: "1px solid var(--line)", padding: "14px 18px" }}>
          The AI engine isn&apos;t reachable at the moment. Start the <code className="mono-text">ai-engine</code> service, then reload this page.
        </div>
      )}

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <div className="dash-panel-head">
          <h3>Run demo pipelines</h3>
        </div>
        <div className="dash-panel-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary" disabled={busy !== null} onClick={() => runDemo("seed")} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {busy === "seed" ? "Seeding…" : "Seed watchlist gallery"}
          </button>
          <button className="btn btn-ghost" disabled={busy !== null} onClick={() => runDemo("gait")} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {busy === "gait" ? "Running…" : "Run gait re-ID demo"}
          </button>
          <button className="btn btn-ghost" disabled={busy !== null} onClick={() => runDemo("activity")} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {busy === "activity" ? "Running…" : "Run activity/loitering demo"}
          </button>
          <button className="btn btn-ghost" disabled={busy !== null} onClick={() => runDemo("detection")} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {busy === "detection" ? "Running…" : "Run object detection demo"}
          </button>
          <button className="btn btn-ghost" disabled={busy !== null} onClick={() => runDemo("fall")} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {busy === "fall" ? "Running…" : "Run fall detection demo"}
          </button>
        </div>
        {message && (
          <div className="dash-panel-body" style={{ paddingTop: 0, fontSize: 13, color: "var(--text-dim)" }}>
            {message}
          </div>
        )}
        {clips.length > 0 && (
          <div className="dash-panel-body" style={{ paddingTop: message ? 0 : undefined }}>
            <div className="demo-clip-grid">
              {clips.map((clip, i) => (
                <div className="demo-clip" key={i}>
                  <video src={clip.url} controls loop muted playsInline preload="metadata" />
                  <div className="demo-clip-label">
                    {clip.suspicious !== undefined && (
                      <span className={`badge ${clip.suspicious ? "tone-red" : "tone-green"}`}>
                        {clip.suspicious ? "alert" : "clear"}
                      </span>
                    )}
                    {clip.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <div className="dash-panel-head">
          <h3>Analyze your own footage</h3>
        </div>
        <div className="dash-panel-body">
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 0, marginBottom: 14 }}>
            Upload a real video with a visible, walking person — the demo clips above are synthetic stick
            figures YOLO won&apos;t recognize as people, but this runs the same pipeline against real footage.
            Processing real video on CPU can take up to a minute.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] ?? null);
                setUploadResult(null);
                setUploadError(null);
              }}
            />
            <button
              className="btn btn-primary"
              disabled={!uploadFile || uploadBusy !== null}
              onClick={() => runUpload("detect")}
              style={{ padding: "10px 18px", fontSize: 13.5 }}
            >
              {uploadBusy === "detect" ? "Detecting & tracking…" : "Detect & track (YOLO + DeepSORT)"}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!uploadFile || uploadBusy !== null}
              onClick={() => runUpload("gait")}
              style={{ padding: "10px 18px", fontSize: 13.5 }}
            >
              {uploadBusy === "gait" ? "Analyzing gait…" : "Analyze walking style (gait)"}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!uploadFile || uploadBusy !== null}
              onClick={() => runUpload("fall")}
              style={{ padding: "10px 18px", fontSize: 13.5 }}
            >
              {uploadBusy === "fall" ? "Checking for a fall…" : "Check for a fall"}
            </button>
          </div>

          {uploadError && (
            <div className="auth-error" style={{ marginTop: 14 }}>
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="demo-clip-grid" style={{ marginTop: 16, maxWidth: 480 }}>
              <div className="demo-clip">
                {uploadResult.videoUrl ? (
                  <video src={uploadResult.videoUrl} controls loop muted playsInline preload="metadata" />
                ) : (
                  <div className="dash-empty">No preview available.</div>
                )}
                <div className="demo-clip-label">
                  <span className={`badge ${uploadResult.suspicious === false ? "tone-green" : uploadResult.suspicious ? "tone-red" : "tone-green"}`}>
                    {uploadResult.kind === "detect" ? "tracked" : uploadResult.kind === "gait" ? "gait" : uploadResult.suspicious ? "fall" : "clear"}
                  </span>
                  {uploadResult.statsText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3>Alert log</h3>
        </div>
        {loading ? (
          <div className="dash-empty">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="dash-empty">No alerts yet — run a demo pipeline above.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Message</th>
                <th>Severity</th>
                <th>Camera</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td className="primary">{ALERT_LABELS[a.type] ?? a.type}</td>
                  <td>{a.message}</td>
                  <td>
                    <span className={`badge ${SEVERITY_TONE[a.severity]}`}>{a.severity}</span>
                  </td>
                  <td>{a.camera_label ?? "—"}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
