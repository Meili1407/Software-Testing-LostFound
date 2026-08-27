const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5050/api";
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return `${SERVER_ORIGIN}${path}`;
}

const ACTOR_STORAGE_KEY = "lostfound.actorId";

export function getActorId(): string | null {
  return localStorage.getItem(ACTOR_STORAGE_KEY);
}

export function setActorId(id: string | null) {
  if (id) localStorage.setItem(ACTOR_STORAGE_KEY, id);
  else localStorage.removeItem(ACTOR_STORAGE_KEY);
}

export class ApiError extends Error {
  details?: string[];

  constructor(message: string, details?: string[]) {
    super(message);
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const actorId = getActorId();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(actorId ? { "x-user-id": actorId } : {}),
    },
    body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(payload.message ?? res.statusText, payload.details);
  }

  return payload.data as T;
}
