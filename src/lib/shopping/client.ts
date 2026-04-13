"use client";

export class ClientRequestError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ClientRequestError(
      response.status,
      payload?.message ?? "Request failed.",
    );
  }

  return response.json() as Promise<T>;
}
