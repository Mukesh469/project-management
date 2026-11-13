const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const apiCall = async (
  endpoint,
  options = {},
  getAuthContext,
  onTokenRefresh
) => {
  const authContext = getAuthContext();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authContext?.accessToken) {
    headers.Authorization = `Bearer ${authContext.accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    console.log("Access token expired, attempting refresh...");

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData?.data?.accessToken;

        if (newAccessToken) {
          onTokenRefresh(newAccessToken);

          headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: "include",
          });
        }
      } else {
        console.error("Token refresh failed");
        throw new Error("Session expired. Please login again.");
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      throw err;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
};

export const api = {
  get: (endpoint, getAuthContext, onTokenRefresh) =>
    apiCall(endpoint, { method: "GET" }, getAuthContext, onTokenRefresh),

  post: (endpoint, body, getAuthContext, onTokenRefresh) =>
    apiCall(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      getAuthContext,
      onTokenRefresh
    ),

  put: (endpoint, body, getAuthContext, onTokenRefresh) =>
    apiCall(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      getAuthContext,
      onTokenRefresh
    ),

  delete: (endpoint, getAuthContext, onTokenRefresh) =>
    apiCall(endpoint, { method: "DELETE" }, getAuthContext, onTokenRefresh),
};
