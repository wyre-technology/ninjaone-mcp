/**
 * Tests for NinjaOne HTTP client with OAuth2 authentication
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NinjaOneHttp } from "../../ninjaone/http.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(text: string, status: number): Response {
  return new Response(text, { status });
}

describe("NinjaOneHttp", () => {
  let http: NinjaOneHttp;

  beforeEach(() => {
    mockFetch.mockReset();
    http = new NinjaOneHttp({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      baseUrl: "https://app.ninjarmm.com",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("OAuth2 token acquisition", () => {
    it("should fetch a token before making API requests", async () => {
      // Token request
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "test-token", token_type: "Bearer", expires_in: 3600 })
      );
      // Actual API request
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await http.get("/v2/test");

      // First call should be token request
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const tokenCall = mockFetch.mock.calls[0];
      expect(tokenCall[0]).toBe("https://app.ninjarmm.com/ws/oauth/token");
      expect(tokenCall[1].method).toBe("POST");
      expect(tokenCall[1].body).toContain("grant_type=client_credentials");
      expect(tokenCall[1].body).toContain("client_id=test-client-id");
      expect(tokenCall[1].body).toContain("client_secret=test-client-secret");
    });

    it("should cache the token for subsequent requests", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "test-token", expires_in: 3600 })
      );
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 2 }));

      await http.get("/v2/first");
      await http.get("/v2/second");

      // Only 1 token request + 2 API requests = 3 total
      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Both API requests should use the same token
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer test-token");
      expect(mockFetch.mock.calls[2][1].headers.Authorization).toBe("Bearer test-token");
    });

    it("should throw on token request failure", async () => {
      mockFetch.mockResolvedValueOnce(textResponse("Unauthorized", 401));

      await expect(http.get("/v2/test")).rejects.toThrow("NinjaOne OAuth2 token request failed");
    });

    it("should throw if access_token is missing from response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ token_type: "Bearer" }));

      await expect(http.get("/v2/test")).rejects.toThrow("missing access_token");
    });
  });

  describe("API requests", () => {
    beforeEach(() => {
      // Pre-seed a valid token for each test
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "test-token", expires_in: 3600 })
      );
    });

    it("should make GET requests with query parameters", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1 }]));

      await http.get("/v2/devices", { pageSize: 50, status: "ACTIVE" });

      const apiCall = mockFetch.mock.calls[1];
      const url = new URL(apiCall[0]);
      expect(url.pathname).toBe("/api/v2/devices");
      expect(url.searchParams.get("pageSize")).toBe("50");
      expect(url.searchParams.get("status")).toBe("ACTIVE");
      expect(apiCall[1].method).toBe("GET");
    });

    it("should skip undefined query parameters", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await http.get("/v2/devices", { pageSize: 50, status: undefined });

      const url = new URL(mockFetch.mock.calls[1][0]);
      expect(url.searchParams.has("pageSize")).toBe(true);
      expect(url.searchParams.has("status")).toBe(false);
    });

    it("should make POST requests with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 100 }));

      await http.post("/v2/ticketing/ticket", { subject: "Test", organizationId: 1 });

      const apiCall = mockFetch.mock.calls[1];
      expect(apiCall[1].method).toBe("POST");
      expect(apiCall[1].headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(apiCall[1].body)).toEqual({ subject: "Test", organizationId: 1 });
    });

    it("should make PUT requests", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await http.put("/v2/ticketing/ticket/1", { status: "CLOSED" });

      const apiCall = mockFetch.mock.calls[1];
      expect(apiCall[1].method).toBe("PUT");
    });

    it("should make DELETE requests", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await http.delete("/v2/ticketing/ticket/1");

      const apiCall = mockFetch.mock.calls[1];
      expect(apiCall[1].method).toBe("DELETE");
      expect(result).toBeUndefined();
    });

    it("should handle 204 No Content responses", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await http.request("POST", "/v2/device/1/reboot");
      expect(result).toBeUndefined();
    });

    it("should throw on non-2xx responses with error detail", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: "Ticket not found" }, 404)
      );

      await expect(http.get("/v2/ticketing/ticket/999")).rejects.toThrow(
        "NinjaOne API error (404 GET /v2/ticketing/ticket/999): Ticket not found"
      );
    });
  });

  describe("401 retry", () => {
    it("should retry once on 401 with a fresh token", async () => {
      // Initial token
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "token-1", expires_in: 3600 })
      );
      // First API call returns 401
      mockFetch.mockResolvedValueOnce(textResponse("", 401));
      // Token refresh
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "token-2", expires_in: 3600 })
      );
      // Retried API call succeeds
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      const result = await http.get("/v2/test");

      expect(result).toEqual({ id: 1 });
      expect(mockFetch).toHaveBeenCalledTimes(4);
      // The retry should use the new token
      expect(mockFetch.mock.calls[3][1].headers.Authorization).toBe("Bearer token-2");
    });
  });
});
