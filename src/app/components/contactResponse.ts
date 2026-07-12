export async function isSuccessfulContactResponse(response: Response) {
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return false;
  }

  try {
    const payload = (await response.json()) as { ok?: unknown };
    return payload.ok === true;
  } catch {
    return false;
  }
}
