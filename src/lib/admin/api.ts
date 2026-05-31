export type AdminMutationMethod = "POST" | "PUT" | "DELETE";

export function adminMutate(method: AdminMutationMethod, body: unknown) {
  return fetch("/api/admin", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
