/**
 * Tests for NinjaOneClient — verifies method -> endpoint mapping
 *
 * We mock global.fetch to intercept all HTTP calls and verify
 * the correct endpoints are called.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NinjaOneClient } from "../../ninjaone/client.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/** Helper: create a JSON Response */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Pre-seed a valid OAuth2 token response */
function seedToken() {
  mockFetch.mockResolvedValueOnce(
    jsonResponse({ access_token: "test-token", token_type: "Bearer", expires_in: 3600 })
  );
}

/** Get the URL path from the Nth fetch call (0-indexed) */
function getCallPath(n: number): string {
  return new URL(mockFetch.mock.calls[n][0]).pathname;
}

/** Get the HTTP method from the Nth fetch call */
function getCallMethod(n: number): string {
  return mockFetch.mock.calls[n][1].method;
}

/** Get the parsed body from the Nth fetch call */
function getCallBody(n: number): unknown {
  const body = mockFetch.mock.calls[n][1].body;
  return body ? JSON.parse(body) : undefined;
}

/** Get query params from the Nth fetch call */
function getCallQuery(n: number): URLSearchParams {
  return new URL(mockFetch.mock.calls[n][0]).searchParams;
}

describe("NinjaOneClient", () => {
  let client: NinjaOneClient;

  // Index of the API call (0 = token request, 1 = first API call)
  const API = 1;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new NinjaOneClient({
      clientId: "test",
      clientSecret: "test",
      baseUrl: "https://app.ninjarmm.com",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Devices ────────────────────────────────────────────────

  describe("devices", () => {
    it("list should GET /api/v2/devices", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.devices.list({ pageSize: 50 });

      expect(getCallPath(API)).toBe("/api/v2/devices");
      expect(getCallMethod(API)).toBe("GET");
      expect(getCallQuery(API).get("pageSize")).toBe("50");
    });

    it("get should GET /api/v2/device/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 42 }));

      await client.devices.get(42);

      expect(getCallPath(API)).toBe("/api/v2/device/42");
      expect(getCallMethod(API)).toBe("GET");
    });

    it("reboot should POST /api/v2/device/{id}/reboot", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await client.devices.reboot(42, "maintenance");

      expect(getCallPath(API)).toBe("/api/v2/device/42/reboot");
      expect(getCallMethod(API)).toBe("POST");
      expect(getCallBody(API)).toEqual({ reason: "maintenance" });
    });

    it("getServices should GET /api/v2/device/{id}/windows-services", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.devices.getServices(42);

      expect(getCallPath(API)).toBe("/api/v2/device/42/windows-services");
    });

    it("getActivities should GET /api/v2/device/{id}/activities", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.devices.getActivities(42, { pageSize: 25 });

      expect(getCallPath(API)).toBe("/api/v2/device/42/activities");
      expect(getCallQuery(API).get("pageSize")).toBe("25");
    });
  });

  // ── Organizations ──────────────────────────────────────────

  describe("organizations", () => {
    it("list should GET /api/v2/organizations", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.organizations.list();

      expect(getCallPath(API)).toBe("/api/v2/organizations");
    });

    it("get should GET /api/v2/organization/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 5 }));

      await client.organizations.get(5);

      expect(getCallPath(API)).toBe("/api/v2/organization/5");
    });

    it("create should POST /api/v2/organizations", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 10 }));

      await client.organizations.create({ name: "Test Org" });

      expect(getCallPath(API)).toBe("/api/v2/organizations");
      expect(getCallMethod(API)).toBe("POST");
      expect(getCallBody(API)).toEqual({ name: "Test Org" });
    });
  });

  // ── Alerts ─────────────────────────────────────────────────

  describe("alerts", () => {
    it("list should GET /api/v2/alerts with filters", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.alerts.list({ severity: "CRITICAL", pageSize: 50 });

      expect(getCallPath(API)).toBe("/api/v2/alerts");
      expect(getCallQuery(API).get("severity")).toBe("CRITICAL");
      expect(getCallQuery(API).get("pageSize")).toBe("50");
    });

    it("reset should DELETE /api/v2/alert/{uid}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await client.alerts.reset("abc-123");

      expect(getCallPath(API)).toBe("/api/v2/alert/abc-123");
      expect(getCallMethod(API)).toBe("DELETE");
    });

    it("listByDevice should GET /api/v2/device/{id}/alerts", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.alerts.listByDevice(42);

      expect(getCallPath(API)).toBe("/api/v2/device/42/alerts");
    });
  });

  // ── Tickets ────────────────────────────────────────────────

  describe("tickets", () => {
    it("list should GET /api/v2/ticketing/ticket and normalize response", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ tickets: [{ id: 1 }], cursor: "abc" })
      );

      const result = await client.tickets.list({ status: "OPEN", pageSize: 50 });

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket");
      expect(getCallQuery(API).get("status")).toBe("OPEN");
      expect(result).toEqual({ tickets: [{ id: 1 }], cursor: "abc" });
    });

    it("list should normalize array response", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1 }, { id: 2 }]));

      const result = await client.tickets.list();

      expect(result).toEqual({ tickets: [{ id: 1 }, { id: 2 }] });
    });

    it("get should GET /api/v2/ticketing/ticket/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await client.tickets.get(1);

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket/1");
    });

    it("create should POST /api/v2/ticketing/ticket", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 100 }));

      const params = { subject: "Test", organizationId: 1 };
      await client.tickets.create(params);

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket");
      expect(getCallMethod(API)).toBe("POST");
      expect(getCallBody(API)).toEqual(params);
    });

    it("update should PUT /api/v2/ticketing/ticket/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await client.tickets.update(1, { status: "CLOSED" });

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket/1");
      expect(getCallMethod(API)).toBe("PUT");
    });

    it("delete should DELETE /api/v2/ticketing/ticket/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await client.tickets.delete(1);

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket/1");
      expect(getCallMethod(API)).toBe("DELETE");
    });

    it("addComment should POST /api/v2/ticketing/ticket/{id}/comment", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 50 }));

      await client.tickets.addComment(1, { body: "test", internal: false });

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket/1/comment");
      expect(getCallMethod(API)).toBe("POST");
    });

    it("getComments should GET /api/v2/ticketing/ticket/{id}/log-entry", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getComments(1);

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket/1/log-entry");
    });

    it("getComments with type filter should pass query param", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getComments(1, "COMMENT");

      expect(getCallQuery(API).get("type")).toBe("COMMENT");
    });

    it("listBoards should GET /api/v2/ticketing/trigger/boards", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.listBoards();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/trigger/boards");
    });

    it("getTicketsByBoard should POST /api/v2/ticketing/trigger/board/{id}/run", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ tickets: [] }));

      await client.tickets.getTicketsByBoard(3, {
        sortBy: [{ field: "createTime", direction: "ASC" }],
        pageSize: 100,
      });

      expect(getCallPath(API)).toBe("/api/v2/ticketing/trigger/board/3/run");
      expect(getCallMethod(API)).toBe("POST");
    });

    it("listForms should GET /api/v2/ticketing/ticket-form", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.listForms();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket-form");
    });

    it("getForm should GET /api/v2/ticketing/ticket-form/{id}", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await client.tickets.getForm(1);

      expect(getCallPath(API)).toBe("/api/v2/ticketing/ticket-form/1");
    });

    it("getStatuses should GET /api/v2/ticketing/statuses", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getStatuses();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/statuses");
    });

    it("getAttributes should GET /api/v2/ticketing/attributes", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getAttributes();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/attributes");
    });

    it("getContacts should GET /api/v2/ticketing/contact/contacts", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getContacts();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/contact/contacts");
    });

    it("getUsers should GET /api/v2/ticketing/app-user-contact", async () => {
      seedToken();
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.tickets.getUsers();

      expect(getCallPath(API)).toBe("/api/v2/ticketing/app-user-contact");
    });
  });
});
