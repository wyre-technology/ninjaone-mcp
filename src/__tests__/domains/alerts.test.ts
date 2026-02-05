/**
 * Tests for alerts domain handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock functions using vi.hoisted
const {
  mockAlertsList,
  mockAlertsReset,
  mockAlertsResetAll,
  mockAlertsGetSummary,
  mockClient,
} = vi.hoisted(() => {
  const mockAlertsList = vi.fn();
  const mockAlertsReset = vi.fn();
  const mockAlertsResetAll = vi.fn();
  const mockAlertsGetSummary = vi.fn();

  const mockClient = {
    alerts: {
      list: mockAlertsList,
      reset: mockAlertsReset,
      resetAll: mockAlertsResetAll,
      getSummary: mockAlertsGetSummary,
    },
  };

  return {
    mockAlertsList,
    mockAlertsReset,
    mockAlertsResetAll,
    mockAlertsGetSummary,
    mockClient,
  };
});

// Mock the client module before importing the handler
vi.mock("../../utils/client.js", () => ({
  getClient: () => Promise.resolve(mockClient),
  clearClient: vi.fn(),
  getCredentials: () => ({
    clientId: "test",
    clientSecret: "test",
    region: "us",
    baseUrl: "https://app.ninjarmm.com",
  }),
}));

// Import handler after mocking
import { alertsHandler } from "../../domains/alerts.js";

describe("Alerts Domain Handler", () => {
  beforeEach(() => {
    // Clear call history
    mockAlertsList.mockClear();
    mockAlertsReset.mockClear();
    mockAlertsResetAll.mockClear();
    mockAlertsGetSummary.mockClear();

    // Reset mock implementations
    mockAlertsList.mockResolvedValue({
      alerts: [
        { uid: "alert-1", message: "Alert 1", severity: "CRITICAL" },
        { uid: "alert-2", message: "Alert 2", severity: "MAJOR" },
      ],
      cursor: "next-page",
    });
    mockAlertsReset.mockResolvedValue({ success: true });
    mockAlertsResetAll.mockResolvedValue({ count: 5 });
    mockAlertsGetSummary.mockResolvedValue({
      bySeverity: {
        CRITICAL: 2,
        MAJOR: 5,
        MINOR: 10,
      },
    });
  });

  describe("getTools", () => {
    it("should return all alert tools", () => {
      const tools = alertsHandler.getTools();

      expect(tools.length).toBe(4);

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain("ninjaone_alerts_list");
      expect(toolNames).toContain("ninjaone_alerts_reset");
      expect(toolNames).toContain("ninjaone_alerts_reset_all");
      expect(toolNames).toContain("ninjaone_alerts_summary");
    });

    it("ninjaone_alerts_reset should require alert_uid", () => {
      const tools = alertsHandler.getTools();
      const resetTool = tools.find((t) => t.name === "ninjaone_alerts_reset");

      expect(resetTool).toBeDefined();
      expect(resetTool?.inputSchema.required).toContain("alert_uid");
    });
  });

  describe("handleCall", () => {
    describe("ninjaone_alerts_list", () => {
      it("should list alerts with default parameters", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_list", {});

        expect(result.isError).toBeUndefined();
        expect(result.content[0].type).toBe("text");

        const data = JSON.parse(result.content[0].text);
        expect(data.alerts).toHaveLength(2);
        expect(data.cursor).toBe("next-page");
      });

      it("should pass filters to API", async () => {
        await alertsHandler.handleCall("ninjaone_alerts_list", {
          severity: "CRITICAL",
          organization_id: 5,
          device_id: 10,
          limit: 25,
        });

        expect(mockAlertsList).toHaveBeenCalledWith({
          severity: "CRITICAL",
          organizationId: 5,
          deviceId: 10,
          sourceType: undefined,
          pageSize: 25,
          cursor: undefined,
        });
      });
    });

    describe("ninjaone_alerts_reset", () => {
      it("should reset a single alert", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_reset", {
          alert_uid: "alert-1",
        });

        expect(result.isError).toBeUndefined();

        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.message).toBe("Alert reset successfully");
      });
    });

    describe("ninjaone_alerts_reset_all", () => {
      it("should reset all alerts for a device", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_reset_all", {
          device_id: 1,
        });

        expect(result.isError).toBeUndefined();

        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
      });

      it("should reset all alerts for an organization", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_reset_all", {
          organization_id: 1,
        });

        expect(result.isError).toBeUndefined();

        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
      });

      it("should return error when neither device_id nor organization_id provided", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_reset_all", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Must specify either device_id or organization_id");
      });
    });

    describe("ninjaone_alerts_summary", () => {
      it("should get alert summary", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_summary", {});

        expect(result.isError).toBeUndefined();

        const data = JSON.parse(result.content[0].text);
        expect(data.bySeverity).toBeDefined();
      });
    });

    describe("unknown tool", () => {
      it("should return error for unknown tool", async () => {
        const result = await alertsHandler.handleCall("ninjaone_alerts_unknown", {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown alert tool");
      });
    });
  });
});
