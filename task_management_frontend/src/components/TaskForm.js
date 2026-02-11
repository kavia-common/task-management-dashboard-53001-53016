import React, { useMemo, useState } from "react";

function normalizePriority(p) {
  const v = String(p || "").toLowerCase();
  if (["low", "medium", "high"].includes(v)) return v;
  return "medium";
}

function normalizeStatus(s) {
  const v = String(s || "").toLowerCase();
  if (["todo", "in_progress", "done"].includes(v)) return v;
  // allow "in-progress" too
  if (v === "in-progress") return "in_progress";
  return "todo";
}

// PUBLIC_INTERFACE
export default function TaskForm({ initial, onSubmit, submitLabel = "Save", busy = false }) {
  /** Task form for create/edit.
   * Tries to stay backend-agnostic by using common fields: title, description, status, priority, due_date.
   */
  const init = useMemo(
    () => ({
      title: initial?.title || "",
      description: initial?.description || "",
      status: normalizeStatus(initial?.status),
      priority: normalizePriority(initial?.priority),
      due_date: initial?.due_date ? String(initial.due_date).slice(0, 10) : "",
    }),
    [initial]
  );

  const [values, setValues] = useState(init);

  const set = (key, val) => setValues((p) => ({ ...p, [key]: val }));

  const canSubmit = values.title.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || busy) return;
        onSubmit?.({
          title: values.title.trim(),
          description: values.description.trim(),
          status: values.status,
          priority: values.priority,
          due_date: values.due_date ? values.due_date : null,
        });
      }}
    >
      <div className="inputRow">
        <div>
          <input
            className="input"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Task title"
            aria-label="Task title"
            autoFocus
          />
          <div className="helpText">A short, clear title is best.</div>
        </div>

        <textarea
          className="input"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Description (optional)"
          aria-label="Description"
          rows={4}
          style={{ resize: "vertical" }}
        />

        <div className="inputGrid2">
          <label>
            <div className="helpText">Status</div>
            <select
              className="select"
              value={values.status}
              onChange={(e) => set("status", e.target.value)}
              aria-label="Status"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label>
            <div className="helpText">Priority</div>
            <select
              className="select"
              value={values.priority}
              onChange={(e) => set("priority", e.target.value)}
              aria-label="Priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label>
          <div className="helpText">Due date</div>
          <input
            className="input"
            type="date"
            value={values.due_date || ""}
            onChange={(e) => set("due_date", e.target.value)}
            aria-label="Due date"
          />
        </label>

        <button className="btn btnPrimary" type="submit" disabled={!canSubmit || busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
