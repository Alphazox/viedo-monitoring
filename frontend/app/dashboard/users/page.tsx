"use client";

import { useEffect, useState } from "react";
import { useAuth, ApiError } from "@/context/auth-context";
import { usersApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";

const ROLES = ["VIEWER", "SECURITY_OPERATOR", "ADMIN"] as const;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("VIEWER");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const res = await usersApi.list();
    setUsers(res.items);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await usersApi.list();
        setUsers(res.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.create({ email, password, full_name: fullName, role });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("VIEWER");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>People with access to this organization.</p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {isAdmin && (
        <div className="dash-panel" style={{ marginBottom: 16 }}>
          <div className="dash-panel-head">
            <h3>Invite a user</h3>
          </div>
          <form onSubmit={handleCreate} className="dash-panel-body" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="dash-field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="u-name">Full name</label>
              <input id="u-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="dash-field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="u-email">Email</label>
              <input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="dash-field" style={{ flex: "1 1 160px" }}>
              <label htmlFor="u-password">Temporary password</label>
              <input id="u-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="dash-field" style={{ flex: "1 1 140px" }}>
              <label htmlFor="u-role">Role</label>
              <select id="u-role" value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: "10px 18px", fontSize: 13.5 }}>
              {submitting ? "Adding…" : "Add user"}
            </button>
          </form>
        </div>
      )}

      <div className="dash-panel">
        {loading ? (
          <div className="dash-empty">Loading…</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="primary">{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge">{u.role.replace("_", " ").toLowerCase()}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? "tone-green" : "tone-red"}`}>
                      {u.is_active ? "active" : "disabled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
