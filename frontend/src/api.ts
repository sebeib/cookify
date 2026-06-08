import axios, { AxiosError, type Method } from "axios";
import type { InviteResponse, LoginResponse } from "./types";

type RequestOptions = {
  method?: Method;
  body?: unknown;
  token?: string | null;
};

type ApiErrorPayload = {
  message?: string;
};

const apiClient = axios.create({
  headers: {
    Accept: "application/json",
  },
});

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

export async function createInvite(
  roleName: "ADMIN" | "USER",
  token: string | null,
): Promise<InviteResponse> {
  return request<InviteResponse>("/api/invite", {
    method: "POST",
    body: { roleName },
    token,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      method: options.method ?? "GET",
      headers: buildHeaders(options),
      data: options.body,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    return response.data;
  } catch (error) {
    let message = "The request could not be completed.";

    if (error instanceof AxiosError) {
      const payload = error.response?.data as ApiErrorPayload | undefined;
      if (payload?.message) {
        message = payload.message;
      }
    }

    throw new Error(message);
  }
}

function buildHeaders(options: RequestOptions) {
  const headers: Record<string, string> = {
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
}
