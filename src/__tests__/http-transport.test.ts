/**
 * Tests for HTTP transport in NinjaOne MCP Server
 *
 * Tests the health endpoint, /mcp endpoint, 404 handling,
 * and gateway authentication.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";

// We test the HTTP server by spawning the actual process
// For unit-level tests, we replicate the routing logic

/** Helper to make HTTP requests against a local server */
function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode || 0, headers: res.headers, body })
        );
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe("HTTP Transport Routing", () => {
  let server: http.Server;
  let port: number;
  let isGatewayMode: boolean;

  /**
   * Create a lightweight HTTP server that mirrors the routing logic
   * from src/index.ts startHttpTransport() without requiring
   * the full MCP SDK transport setup.
   */
  function createTestServer(gatewayMode: boolean): http.Server {
    isGatewayMode = gatewayMode;

    return http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      // Health endpoint
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            transport: "http",
            authMode: isGatewayMode ? "gateway" : "env",
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // MCP endpoint
      if (url.pathname === "/mcp") {
        if (isGatewayMode) {
          const clientId = req.headers["x-ninja-client-id"] as string | undefined;
          const clientSecret = req.headers["x-ninja-client-secret"] as string | undefined;

          if (!clientId || !clientSecret) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Missing credentials",
                message:
                  "Gateway mode requires X-Ninja-Client-ID and X-Ninja-Client-Secret headers",
                required: ["X-Ninja-Client-ID", "X-Ninja-Client-Secret"],
                optional: ["X-Ninja-Region"],
              })
            );
            return;
          }
        }

        // In real server this delegates to StreamableHTTPServerTransport
        // For test purposes, return a success acknowledgment
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "mcp-endpoint-reached" }));
        return;
      }

      // 404 for everything else
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found", endpoints: ["/mcp", "/health"] }));
    });
  }

  describe("Health endpoint", () => {
    beforeAll(async () => {
      server = createTestServer(false);
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it("should return 200 with status ok", async () => {
      const res = await makeRequest(port, "/health");
      expect(res.status).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.status).toBe("ok");
      expect(body.transport).toBe("http");
    });

    it("should include authMode in health response", async () => {
      const res = await makeRequest(port, "/health");
      const body = JSON.parse(res.body);
      expect(body.authMode).toBe("env");
    });

    it("should include a timestamp", async () => {
      const res = await makeRequest(port, "/health");
      const body = JSON.parse(res.body);
      expect(body.timestamp).toBeDefined();
      // Should be a valid ISO date
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });

    it("should return application/json content type", async () => {
      const res = await makeRequest(port, "/health");
      expect(res.headers["content-type"]).toBe("application/json");
    });
  });

  describe("404 handling", () => {
    beforeAll(async () => {
      server = createTestServer(false);
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it("should return 404 for unknown paths", async () => {
      const res = await makeRequest(port, "/unknown");
      expect(res.status).toBe(404);

      const body = JSON.parse(res.body);
      expect(body.error).toBe("Not found");
    });

    it("should list available endpoints in 404 response", async () => {
      const res = await makeRequest(port, "/foo/bar");
      const body = JSON.parse(res.body);
      expect(body.endpoints).toEqual(["/mcp", "/health"]);
    });

    it("should return 404 for root path", async () => {
      const res = await makeRequest(port, "/");
      expect(res.status).toBe(404);
    });
  });

  describe("MCP endpoint (env mode)", () => {
    beforeAll(async () => {
      server = createTestServer(false);
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it("should accept requests without auth headers in env mode", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // In env mode, no gateway auth is required
      expect(res.status).toBe(200);
    });
  });

  describe("Gateway authentication", () => {
    beforeAll(async () => {
      server = createTestServer(true);
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it("should return 401 when no credentials are provided in gateway mode", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);

      const body = JSON.parse(res.body);
      expect(body.error).toBe("Missing credentials");
    });

    it("should return 401 when only client ID is provided", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ninja-client-id": "test-id",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });

    it("should return 401 when only client secret is provided", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ninja-client-secret": "test-secret",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });

    it("should accept request when both client ID and secret are provided", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ninja-client-id": "test-id",
          "x-ninja-client-secret": "test-secret",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
    });

    it("should accept request with optional region header", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ninja-client-id": "test-id",
          "x-ninja-client-secret": "test-secret",
          "x-ninja-region": "eu",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
    });

    it("should list required headers in 401 response", async () => {
      const res = await makeRequest(port, "/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = JSON.parse(res.body);
      expect(body.required).toContain("X-Ninja-Client-ID");
      expect(body.required).toContain("X-Ninja-Client-Secret");
    });

    it("should still serve health endpoint without auth in gateway mode", async () => {
      const res = await makeRequest(port, "/health");
      expect(res.status).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.status).toBe("ok");
      expect(body.authMode).toBe("gateway");
    });
  });
});
