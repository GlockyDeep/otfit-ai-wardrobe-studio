// A random id per browser, used to keep "My looks" private to this browser (there are no user accounts).
const KEY = 'otfit_owner_id';
let memoryId: string | null = null;

export function getOwnerId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Private mode / storage blocked: keep an id for this tab only
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** POST helper that surfaces the backend's `detail` message on errors */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
  return res.json();
}
