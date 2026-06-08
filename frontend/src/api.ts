import type { LoginResponse } from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

type ApiErrorPayload = {
  message?: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export async function logout(token: string | null): Promise<void> {
  await request("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export async function registerWithInvite(
  token: string,
  payload: {
    username: string;
    password: string;
    displayName: string;
  },
) {
  return request(`/api/invite/${token}`, {
    method: "POST",
    body: payload,
  });
}

export async function checkInvite(token: string): Promise<void> {
  await request(`/api/invite/${token}`, {
    method: "GET",
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = "The request could not be completed.";

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parsing errors and keep the default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function buildHeaders(options: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
}
