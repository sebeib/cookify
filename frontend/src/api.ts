import axios, { AxiosError, type Method } from "axios";
import type {
  CreateRecipePayload,
  ImportedRecipe,
  InviteResponse,
  LoginResponse,
  Recipe,
  RecipeCard,
  Tag,
  User,
} from "./types";

type RequestOptions = {
  method?: Method;
  body?: unknown;
  token?: string | null;
  suppressUnauthorizedHandler?: boolean;
};

type ApiErrorPayload = {
  message?: string;
};

const apiClient = axios.create({
  headers: {
    Accept: "application/json",
  },
});

export class UnauthorizedError extends Error {}

let unauthorizedHandler: ((message: string) => void) | null = null;

export function setUnauthorizedHandler(handler: ((message: string) => void) | null) {
  unauthorizedHandler = handler;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

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
    suppressUnauthorizedHandler: true,
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

export async function getRecipes(token: string | null, query?: string): Promise<RecipeCard[]> {
  const searchParams = new URLSearchParams();

  if (query && query.trim()) {
    searchParams.set("query", query.trim());
  }

  const path = searchParams.size > 0 ? `/api/recipe?${searchParams.toString()}` : "/api/recipe";

  return request<RecipeCard[]>(path, {
    token,
  });
}

export async function getRecipe(id: string, token: string | null): Promise<Recipe> {
  return request<Recipe>(`/api/recipe/${id}`, {
    token,
  });
}

export async function createRecipe(
  payload: CreateRecipePayload,
  token: string | null,
): Promise<Recipe> {
  return request<Recipe>("/api/recipe", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateRecipe(
  id: string,
  payload: CreateRecipePayload,
  token: string | null,
): Promise<Recipe> {
  return request<Recipe>(`/api/recipe/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function importRecipe(url: string, token: string | null): Promise<ImportedRecipe> {
  return request<ImportedRecipe>("/api/recipe/import", {
    method: "POST",
    body: { url },
    token,
  });
}

export async function getTags(token: string | null, query?: string): Promise<Tag[]> {
  const searchParams = new URLSearchParams();

  if (query && query.trim()) {
    searchParams.set("query", query.trim());
  }

  const path = searchParams.size > 0 ? `/api/tag?${searchParams.toString()}` : "/api/tag";

  return request<Tag[]>(path, {
    token,
  });
}

export async function getProfile(token: string | null): Promise<User> {
  return request<User>("/api/user/profile", {
    token,
  });
}

export async function updateProfile(
  payload: {
    displayName: string;
    profileImage: string | null;
  },
  token: string | null,
): Promise<User> {
  return request<User>("/api/user/profile", {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function changePassword(
  payload: {
    currentPassword: string;
    newPassword: string;
  },
  token: string | null,
): Promise<void> {
  await request("/api/user/profile/password", {
    method: "PUT",
    body: payload,
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
    let message = "Die Anfrage konnte nicht abgeschlossen werden.";

    if (error instanceof AxiosError) {
      const payload = error.response?.data as ApiErrorPayload | undefined;
      if (payload?.message) {
        message = payload.message;
      }

      if (
        error.response?.status === 401 &&
        options.token &&
        !options.suppressUnauthorizedHandler
      ) {
        unauthorizedHandler?.(message);
        throw new UnauthorizedError(message);
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
