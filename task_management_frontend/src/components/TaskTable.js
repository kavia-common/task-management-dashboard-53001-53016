import React from "react";

function statusBadge(status) {
  const s = String(status || "todo").toLowerCase();
  if (s === "done") return { label: "Done", cls: "badgeSuccess" };
  if (s === "in_progress" || s === "in-progress") return { label: "In progress", cls: "badgeWarning" };
  return { label: "To do", cls: "" };
}

function priorityPill(priority) {
  const p = String(priority || "medium").toLowerCase();
  if (p === "high") return "High";
  if (p === "low") return "Low";
  return "Medium";
}

// PUBLIC_INTERFACE
export default function TaskTable({ tasks, onEdit, onDelete }) {
  /** Renders tasks in a responsive table. */
  if (!tasks || tasks.length === 0) {
    return <div className="helpText">No tasks yet — create one to get started.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table" aria-label="Task list">
        <thead>
          <tr>
            <th className="th">Task</th>
            <th className="th">Status</th>
            <th className="th">Priority</th>
            <th className="th">Due</th>
            <th className="th" style={{ textAlign: "right" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const badge = statusBadge(t.status);
            return (
              <tr key={t.id || t.task_id || t._id || t.title}>
                <td className="td">
                  <div style={{ display: "grid", gap: 2 }}>
                    <strong style={{ fontSize: 13 }}>{t.title}</strong>
                    {t.description ? <span className="helpText">{t.description}</span> : null}
                  </div>
                </td>
                <td className="td">
                  <span className={`badge ${badge.cls}`}>
                    <span className="badgeDot" />
                    {badge.label}
                  </span>
                </td>
                <td className="td">
                  <span className="pill">{priorityPill(t.priority)}</span>
                </td>
                <td className="td">{t.due_date ? String(t.due_date).slice(0, 10) : <span className="helpText">—</span>}</td>
                <td className="td">
                  <div className="rowActions">
                    <button className="btn btnSm" onClick={() => onEdit?.(t)}>
                      Edit
                    </button>
                    <button className="btn btnSm btnDanger" onClick={() => onDelete?.(t)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
