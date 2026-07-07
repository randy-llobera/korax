'use client';

export const redirectToBillingUrl = async (
  path: string,
  body?: Record<string, string>,
) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; url?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? 'Unable to open billing.');
  }

  window.location.href = payload.url;
};
