
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return null;

        const data = await response.json();

        if (!data.access) return null;

        localStorage.setItem("access_token", data.access);

        if (data.refresh) {
          localStorage.setItem("refresh_token", data.refresh);
        }

        return data.access;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function getErrorMessage(data, status) {
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  if (data && typeof data === "object") {
    return Object.values(data)
      .flat()
      .filter((value) => typeof value === "string")
      .join(" ");
  }

  return `Request failed (${status})`;
}

export async function apiRequest(endpoint, options = {}) {
  const sendRequest = (token) => {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response;

  try {
    const token = localStorage.getItem("access_token");
    response = await sendRequest(token);

    if (response.status === 401) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        response = await sendRequest(newToken);
      }
    }
  } catch {
    throw new Error(
      "Backend se connection nahi ho raha. Django server aur CORS settings check karo."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data;
}
