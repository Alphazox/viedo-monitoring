import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, getAccessToken, setAccessToken, setOnUnauthorized } from "./client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api client", () => {
  beforeEach(() => {
    setAccessToken(null);
    setOnUnauthorized(null);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the Authorization header when an access token is set", async () => {
    setAccessToken("token-123");
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await api.get("/api/v1/cameras");

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("refreshes and retries once on a 401, then updates the access token", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" })) // original request
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "new-token" })) // refresh
      .mockResolvedValueOnce(jsonResponse(200, { items: [] })); // retried request

    const result = await api.get<{ items: unknown[] }>("/api/v1/cameras");

    expect(result).toEqual({ items: [] });
    expect(getAccessToken()).toBe("new-token");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws ApiError and calls onUnauthorized when refresh also fails", async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { detail: "expired" })) // original request
      .mockResolvedValueOnce(jsonResponse(401, { detail: "no session" })); // refresh fails

    await expect(api.get("/api/v1/cameras")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("surfaces the backend's detail message on a non-401 error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(400, { detail: "Invalid site_id" }));

    await expect(api.post("/api/v1/cameras", {})).rejects.toMatchObject({
      status: 400,
      message: "Invalid site_id",
    });
  });
});
