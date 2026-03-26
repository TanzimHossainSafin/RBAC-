"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import type { Permission, Role, User } from "@/lib/types";

interface PermissionPayload {
  permissions: Permission[];
  groups: { label: string; permissions: Permission[] }[];
}

const ROLE_OPTIONS: Role[] = ["admin", "manager", "agent", "customer"];

export function UsersPanel() {
  const { apiFetch, user: currentUser } = useAuth();
  const permissionEditorRef = useRef<HTMLElement | null>(null);
  const editUserRef = useRef<HTMLElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionPayload["groups"]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: currentUser?.role === "manager" ? "agent" : "manager",
  });
  const [editForm, setEditForm] = useState<{ name: string; role: Role }>({
    name: "",
    role: currentUser?.role === "manager" ? "agent" : "manager",
  });

  async function loadData() {
    const usersResponse = await apiFetch<{ users: User[] }>("/users");
    setUsers(usersResponse.users);
    if (currentUser?.permissions.includes("permissions.view")) {
      const permissionsResponse = await apiFetch<PermissionPayload>("/permissions");
      setPermissionGroups(permissionsResponse.groups);
    }
  }

  useEffect(() => {
    void loadData();
  }, [currentUser?.permissions, apiFetch]);

  useEffect(() => {
    async function loadUserPermissions() {
      if (!selectedUserId || !currentUser?.permissions.includes("permissions.view")) return;
      const response = await apiFetch<{ permissions: Permission[] }>(`/users/${selectedUserId}/permissions`);
      setSelectedPermissions(response.permissions);
    }
    void loadUserPermissions();
  }, [selectedUserId, currentUser?.permissions, apiFetch]);

  useEffect(() => {
    if (selectedUserId) {
      permissionEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (editingUser) {
      editUserRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingUser]);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    await apiFetch<{ user: User }>("/users", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({
      name: "",
      email: "",
      password: "",
      role: currentUser?.role === "manager" ? "agent" : "manager",
    });
    setFeedback("User created");
    await loadData();
  }

  async function handleStatus(userId: string, action: "suspend" | "ban") {
    setFeedback(null);
    await apiFetch(`/users/${userId}/${action}`, { method: "POST" });
    setFeedback(`User ${action}ed`);
    await loadData();
  }

  async function handlePermissionSave() {
    if (!selectedUserId) return;
    setFeedback(null);
    await apiFetch(`/users/${selectedUserId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissions: selectedPermissions }),
    });
    setFeedback("Permissions updated");
    await loadData();
  }

  async function handleEditUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setFeedback(null);
    await apiFetch<{ user: User }>(`/users/${editingUser.id}`, {
      method: "PATCH",
      body: JSON.stringify(editForm),
    });
    setEditingUser(null);
    setFeedback("User updated");
    await loadData();
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Users</span>
            <h2>User Management</h2>
          </div>
        </div>

        {feedback ? <div className="success-banner">{feedback}</div> : null}

        <div className="users-table">
          {users.map((user) => (
            <article key={user.id} className="user-row">
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <div>
                <span>{user.role}</span>
                <em>{user.status}</em>
              </div>
              <div className="row-actions">
                {currentUser?.permissions.includes("users.suspend") ? (
                  <button className="small-button" onClick={() => void handleStatus(user.id, "suspend")}>
                    Suspend
                  </button>
                ) : null}
                {currentUser?.permissions.includes("users.edit") ? (
                  <button
                    className="small-button"
                    onClick={() => {
                      setEditingUser(user);
                      setEditForm({
                        name: user.name,
                        role: user.role,
                      });
                    }}
                  >
                    Edit
                  </button>
                ) : null}
                {currentUser?.permissions.includes("users.ban") ? (
                  <button className="small-button alt" onClick={() => void handleStatus(user.id, "ban")}>
                    Ban
                  </button>
                ) : null}
                {currentUser?.permissions.includes("permissions.assign") ? (
                  <button className="small-button" onClick={() => setSelectedUserId(user.id)}>
                    Edit permissions
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {currentUser?.permissions.includes("users.create") ? (
        <section className="panel">
          <span className="eyebrow">Create User</span>
          <h2>Add team member</h2>
          <form className="stack-form" onSubmit={handleCreateUser}>
            <input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input
              placeholder="Temporary password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              {ROLE_OPTIONS.filter((role) => (currentUser?.role === "manager" ? role !== "manager" : true)).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit">
              Create user
            </button>
          </form>
        </section>
      ) : null}

      {editingUser && currentUser?.permissions.includes("users.edit") ? (
        <section className="panel" ref={editUserRef}>
          <span className="eyebrow">Edit User</span>
          <h2>Update team member</h2>
          <form className="stack-form" onSubmit={handleEditUser}>
            <input
              placeholder="Name"
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
            />
            <select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as Role })}>
              {ROLE_OPTIONS.filter((role) => {
                if (currentUser.role === "manager") {
                  return role === "agent" || role === "customer";
                }
                return true;
              }).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit">
              Save changes
            </button>
            <button className="ghost-button" type="button" onClick={() => setEditingUser(null)}>
              Cancel
            </button>
          </form>
        </section>
      ) : null}

      {selectedUserId && currentUser?.permissions.includes("permissions.assign") ? (
        <section className="panel full-width" ref={permissionEditorRef}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Permission Editor</span>
              <h2>Grant ceiling aware assignment</h2>
            </div>
          </div>

          <div className="permission-groups">
            {permissionGroups.map((group) => (
              <div key={group.label} className="permission-group">
                <strong>{group.label}</strong>
                <div className="chip-grid">
                  {group.permissions.map((permission) => {
                    const checked = selectedPermissions.includes(permission);
                    const disabled = !currentUser.permissions.includes(permission);
                    return (
                      <label key={permission} className={disabled ? "permission-toggle disabled" : "permission-toggle"}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) =>
                            setSelectedPermissions((current) =>
                              event.target.checked ? [...current, permission] : current.filter((item) => item !== permission),
                            )
                          }
                        />
                        <span>{permission}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="row-actions">
            <button className="primary-button" onClick={() => void handlePermissionSave()}>
              Save permissions
            </button>
            <button className="ghost-button" onClick={() => setSelectedUserId(null)}>
              Close
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
