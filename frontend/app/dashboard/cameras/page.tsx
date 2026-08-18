"use client";

import { useEffect, useState } from "react";
import { camerasApi } from "@/lib/api/resources";
import { ApiError } from "@/context/auth-context";
import { LiveView } from "@/components/dashboard/live-view";
import type { Camera } from "@/lib/api/types";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [streamType, setStreamType] = useState<"UPLOAD" | "RTSP">("UPLOAD");
  const [streamUrl, setStreamUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liveCameraId, setLiveCameraId] = useState<string | null>(null);

  async function refresh() {
    const res = await camerasApi.list();
    setCameras(res.items);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await camerasApi.list();
        setCameras(res.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load cameras.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await camerasApi.create({
        name: name.trim(),
        location: location.trim() || undefined,
        stream_type: streamType,
        stream_url: streamType === "RTSP" ? streamUrl.trim() || undefined : undefined,
      });
      setName("");
      setLocation("");
      setStreamType("UPLOAD");
      setStreamUrl("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create camera.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await camerasApi.remove(id);
      setCameras((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete camera.");
    }
  }

  async function handleToggleStatus(camera: Camera) {
    const nextStatus = camera.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    try {
      const updated = await camerasApi.update(camera.id, { status: nextStatus });
      setCameras((prev) => prev.map((c) => (c.id === camera.id ? updated : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update camera.");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Cameras</h1>
          <p>Cameras registered across your sites.</p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <div className="dash-panel-head">
          <h3>Add a camera</h3>
        </div>
        <form onSubmit={handleCreate} className="dash-panel-body" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="dash-field" style={{ flex: "1 1 200px" }}>
            <label htmlFor="cam-name">Name</label>
            <input id="cam-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rear Loading Dock" required />
          </div>
          <div className="dash-field" style={{ flex: "1 1 200px" }}>
            <label htmlFor="cam-location">Location</label>
            <input id="cam-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>
          <div className="dash-field" style={{ flex: "1 1 140px" }}>
            <label htmlFor="cam-stream-type">Source</label>
            <select
              id="cam-stream-type"
              value={streamType}
              onChange={(e) => setStreamType(e.target.value as "UPLOAD" | "RTSP")}
            >
              <option value="UPLOAD">Upload</option>
              <option value="RTSP">RTSP camera</option>
            </select>
          </div>
          {streamType === "RTSP" && (
            <div className="dash-field" style={{ flex: "1 1 260px" }}>
              <label htmlFor="cam-stream-url">RTSP URL</label>
              <input
                id="cam-stream-url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="rtsp://user:pass@camera-ip/stream"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: "10px 18px", fontSize: 13.5 }}>
            {submitting ? "Adding…" : "Add camera"}
          </button>
        </form>
      </div>

      <div className="dash-panel">
        {loading ? (
          <div className="dash-empty">Loading…</div>
        ) : cameras.length === 0 ? (
          <div className="dash-empty">No cameras yet — add one above.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((c) => (
                <tr key={c.id}>
                  <td className="primary">{c.name}</td>
                  <td>{c.location ?? "—"}</td>
                  <td>
                    <span className={`badge ${c.status === "ONLINE" ? "tone-green" : "tone-red"}`}>
                      {c.status.toLowerCase()}
                    </span>
                  </td>
                  <td>{c.stream_type}</td>
                  <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                      onClick={() => setLiveCameraId((prev) => (prev === c.id ? null : c.id))}
                    >
                      {liveCameraId === c.id ? "Hide live view" : "View live"}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleToggleStatus(c)}>
                      {c.status === "ONLINE" ? "Mark offline" : "Mark online"}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {liveCameraId && (
          <div style={{ padding: 16 }}>
            <LiveView cameraId={liveCameraId} />
          </div>
        )}
      </div>
    </div>
  );
}
