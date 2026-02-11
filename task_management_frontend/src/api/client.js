/**
 * Lightweight API client for the Task Management backend.
 * Uses REACT_APP_API_BASE (or REACT_APP_BACKEND_URL) and Bearer token auth.
 */

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:3001";

function normalizeError(err) {
  if (!err) return { message: "Unknown error" };
  if (typeof err === "string") return { message: err };
  if (err.message) return { message: err.message };
  return { message: "Request failed" };
}

async function readJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", token, body, headers } = {}) {
  /** Perform a JSON request against backend REST API.
   * @param {string} path Relative path (e.g. "/tasks")
   * @param {object} options method, token, body, headers
   * @returns {Promise<any>} parsed JSON (or null)
   */
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await readJsonSafe(res);

    if (!res.ok) {
      const msg =
        payload?.detail?.message ||
        payload?.detail ||
        payload?.message ||
        `Request failed (${res.status})`;
      const error = new Error(msg);
      error.status = res.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (e) {
    throw normalizeError(e);
  }
}

// ---- Auth endpoints (best-effort). Backend may differ; UI provides a demo fallback. ----

// PUBLIC_INTERFACE
export async function apiLogin({ email, password }) {
  /** Attempt login. Expects backend to return {access_token, token_type, user?}. */
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}

// PUBLIC_INTERFACE
export async function apiRegister({ name, email, password }) {
  /** Attempt register. Expects backend to return created user or token. */
  return apiRequest("/auth/register", { method: "POST", body: { name, email, password } });
}

// PUBLIC_INTERFACE
export async function apiMe(token) {
  /** Get current user profile. */
  return apiRequest("/auth/me", { token });
}

// ---- Tasks ----

// PUBLIC_INTERFACE
export async function apiListTasks(token) {
  /** List tasks for the current user. */
  return apiRequest("/tasks", { token });
}

// PUBLIC_INTERFACE
export async function apiCreateTask(token, task) {
  /** Create a new task. */
  return apiRequest("/tasks", { method: "POST", token, body: task });
}

// PUBLIC_INTERFACE
export async function apiUpdateTask(token, taskId, patch) {
  /** Update an existing task. */
  return apiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    token,
    body: patch,
  });
}

// PUBLIC_INTERFACE
export async function apiDeleteTask(token, taskId) {
  /** Delete a task. */
  return apiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    token,
  });
}
