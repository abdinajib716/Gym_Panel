"use client"

type ApiErrorResponse = {
  error?: string
  details?: Array<{
    path?: string
    message?: string
  }>
}

export async function apiRequest<T = unknown>(
  input: RequestInfo | URL,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(input, {
    ...init,
    headers,
    body:
      init?.body && !(init.body instanceof FormData) && typeof init.body !== "string"
        ? JSON.stringify(init.body)
        : (init?.body as BodyInit | null | undefined),
  })

  const payload = (await response.json().catch(() => null)) as T | ApiErrorResponse | null

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload))
  }

  return payload as T
}

export function getApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Something went wrong"
  }

  const typedPayload = payload as ApiErrorResponse

  if (typedPayload.details?.length) {
    return typedPayload.details.map((detail) => detail.message).filter(Boolean).join(", ")
  }

  return typedPayload.error || "Something went wrong"
}
