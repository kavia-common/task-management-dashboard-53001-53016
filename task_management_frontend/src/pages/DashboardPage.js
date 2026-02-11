import React, { useEffect, useMemo, useState } from "react";
import { apiCreateTask, apiDeleteTask, apiListTasks, apiUpdateTask } from "../api/client";
import { connectRealtime } from "../api/ws";
import Modal from "../components/Modal";
import TaskForm from "../components/TaskForm";
import TaskTable from "../components/TaskTable";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function getId(task) {
  return task?.id ?? task?.task_id ?? task?._id ?? task?.uuid ?? null;
}

function initials(nameOrEmail) {
  const v = String(nameOrEmail || "?").trim();
  if (!v) return "?";
  const parts = v.split(/[.\s@_-]+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return (a + (b || "")).toUpperCase();
}

function eventToToast(evt) {
  // Flexible mapping; backend schema may differ.
  const type = String(evt?.type || evt?.event || "update");
  const message =
    evt?.message ||
    evt?.detail ||
    evt?.payload?.message ||
    (evt?.task?.title ? `${evt.task.title}` : "Task updated");

  if (type.includes("delete")) return { title: "Task deleted", message, variant: "warn" };
  if (type.includes("create")) return { title: "Task created", message, variant: "success" };
  if (type.includes("update")) return { title: "Task updated", message, variant: "info" };
  return { title: "Realtime update", message, variant: "info" };
}

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Main dashboard: lists tasks, supports CRUD, listens for realtime updates. */
  const { token, user, logout } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all"); // all|todo|in_progress|done
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const [saving, setSaving] = useState(false);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tasks || [])
      .filter((t) => {
        if (filter === "all") return true;
        const s = String(t.status || "todo").toLowerCase();
        if (filter === "in_progress") return s === "in_progress" || s === "in-progress";
        return s === filter;
      })
      .filter((t) => {
        if (!q) return true;
        return (
          String(t.title || "").toLowerCase().includes(q) ||
          String(t.description || "").toLowerCase().includes(q)
        );
      });
  }, [tasks, filter, query]);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await apiListTasks(token);
      setTasks(Array.isArray(list) ? list : list?.items || list?.tasks || []);
    } catch (e) {
      toast.push({
        title: "Failed to load tasks",
        message: e.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Realtime connection
  useEffect(() => {
    const conn = connectRealtime({
      token,
      onEvent: (evt) => {
        const t = eventToToast(evt);
        toast.push(t);

        // Best-effort: update local list if event includes task + action
        const action = String(evt?.type || evt?.event || "").toLowerCase();
        const task = evt?.task || evt?.payload?.task;

        if (task) {
          const id = getId(task);
          if (!id) return;

          setTasks((prev) => {
            const idx = prev.findIndex((x) => getId(x) === id);
            if (action.includes("delete")) return prev.filter((x) => getId(x) !== id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...task };
              return copy;
            }
            if (action.includes("create")) return [task, ...prev];
            return prev;
          });
        }
      },
      onStatus: (st) => {
        if (st.state === "open") {
          toast.push({ title: "Realtime connected", message: "Live updates enabled.", variant: "success", timeoutMs: 2500 });
        }
      },
    });

    return () => conn.close();
  }, [token, toast]);

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandTitle">
            <strong>Task Dashboard</strong>
            <span>Light, modern workflow</span>
          </div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          <a className="navItem navItemActive" href="#tasks" onClick={(e) => e.preventDefault()}>
            <span className="navIcon" aria-hidden="true">
              ✓
            </span>
            Tasks
          </a>
          <a className="navItem" href="#activity" onClick={(e) => e.preventDefault()}>
            <span className="navIcon" aria-hidden="true">
              ⟲
            </span>
            Activity
          </a>
          <a className="navItem" href="#settings" onClick={(e) => e.preventDefault()}>
            <span className="navIcon" aria-hidden="true">
              ⚙
            </span>
            Settings
          </a>
        </nav>

        <div className="sidebarFooter">
          <div className="userCard">
            <div className="avatar" aria-hidden="true">
              {initials(user?.name || user?.email)}
            </div>
            <div className="userMeta">
              <strong>{user?.name || "Signed in"}</strong>
              <span>{user?.email || "demo@local"}</span>
            </div>
          </div>

          <button className="btn" onClick={logout}>
            Sign out
          </button>

          <div className="helpText">
            API: <code>{process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL}</code>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="pageTitle">
            <h1>Tasks</h1>
            <p>Create, prioritize, and track work. Updates arrive in real time.</p>
          </div>

          <div className="actionsRow">
            <button className="btn btnPrimary" onClick={() => setCreateOpen(true)}>
              + New task
            </button>
            <button className="btn" onClick={refresh} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <strong>Task list</strong>
            <div className="actionsRow">
              <span className="pill">{filteredTasks.length} shown</span>
              <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search"
                style={{ width: 220 }}
              />
            </div>
          </div>

          <div className="cardBody">
            {loading ? (
              <div className="helpText">Loading tasks…</div>
            ) : (
              <TaskTable
                tasks={filteredTasks}
                onEdit={(t) => setEditTask(t)}
                onDelete={(t) => setDeleteTask(t)}
              />
            )}
          </div>
        </div>
      </main>

      {createOpen ? (
        <Modal
          title="Create task"
          onClose={() => (saving ? null : setCreateOpen(false))}
          footer={
            <button className="btn" onClick={() => setCreateOpen(false)} disabled={saving}>
              Close
            </button>
          }
        >
          <TaskForm
            submitLabel="Create"
            busy={saving}
            onSubmit={async (payload) => {
              setSaving(true);
              try {
                const created = await apiCreateTask(token, payload);
                const task = created?.task || created;
                toast.push({ title: "Task created", message: payload.title, variant: "success" });
                if (task) setTasks((prev) => [task, ...prev]);
                setCreateOpen(false);
              } catch (e) {
                toast.push({ title: "Create failed", message: e.message || "Please try again.", variant: "error" });
              } finally {
                setSaving(false);
              }
            }}
          />
        </Modal>
      ) : null}

      {editTask ? (
        <Modal
          title="Edit task"
          onClose={() => (saving ? null : setEditTask(null))}
          footer={
            <button className="btn" onClick={() => setEditTask(null)} disabled={saving}>
              Close
            </button>
          }
        >
          <TaskForm
            initial={editTask}
            submitLabel="Save changes"
            busy={saving}
            onSubmit={async (patch) => {
              const id = getId(editTask);
              if (!id) {
                toast.push({ title: "Cannot edit", message: "Task has no id.", variant: "error" });
                return;
              }
              setSaving(true);
              try {
                const updated = await apiUpdateTask(token, id, patch);
                const task = updated?.task || updated;
                toast.push({ title: "Task updated", message: patch.title || editTask.title, variant: "success" });

                if (task) {
                  setTasks((prev) => prev.map((x) => (getId(x) === id ? { ...x, ...task } : x)));
                } else {
                  setTasks((prev) => prev.map((x) => (getId(x) === id ? { ...x, ...patch } : x)));
                }
                setEditTask(null);
              } catch (e) {
                toast.push({ title: "Update failed", message: e.message || "Please try again.", variant: "error" });
              } finally {
                setSaving(false);
              }
            }}
          />
        </Modal>
      ) : null}

      {deleteTask ? (
        <Modal
          title="Delete task"
          onClose={() => (saving ? null : setDeleteTask(null))}
          footer={
            <>
              <button className="btn" onClick={() => setDeleteTask(null)} disabled={saving}>
                Cancel
              </button>
              <button
                className="btn btnDanger"
                onClick={async () => {
                  const id = getId(deleteTask);
                  if (!id) {
                    toast.push({ title: "Cannot delete", message: "Task has no id.", variant: "error" });
                    return;
                  }
                  setSaving(true);
                  try {
                    await apiDeleteTask(token, id);
                    toast.push({ title: "Task deleted", message: deleteTask.title, variant: "warn" });
                    setTasks((prev) => prev.filter((x) => getId(x) !== id));
                    setDeleteTask(null);
                  } catch (e) {
                    toast.push({ title: "Delete failed", message: e.message || "Please try again.", variant: "error" });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <div className="helpText" style={{ marginBottom: 10 }}>
            This action cannot be undone.
          </div>
          <div className="card" style={{ padding: 12 }}>
            <strong>{deleteTask.title}</strong>
            {deleteTask.description ? <div className="helpText">{deleteTask.description}</div> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
