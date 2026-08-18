"use client";

import { useAuth } from "@/context/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Your organization and account.</p>
        </div>
      </div>

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <div className="dash-panel-head">
          <h3>Organization</h3>
        </div>
        <div className="dash-panel-body">
          <div className="settings-row">
            <span>Name</span>
            <span className="primary-text">{user?.organization_name}</span>
          </div>
          <div className="settings-row">
            <span>Organization ID</span>
            <span className="mono-text">{user?.organization_id}</span>
          </div>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3>Your account</h3>
        </div>
        <div className="dash-panel-body">
          <div className="settings-row">
            <span>Name</span>
            <span className="primary-text">{user?.full_name}</span>
          </div>
          <div className="settings-row">
            <span>Email</span>
            <span className="primary-text">{user?.email}</span>
          </div>
          <div className="settings-row">
            <span>Role</span>
            <span className="badge">{user?.role.replace("_", " ").toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
